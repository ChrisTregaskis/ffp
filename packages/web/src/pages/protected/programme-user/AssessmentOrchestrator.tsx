import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  flowStepTypeSchema,
  TEMPLATE_LINKED_STEP_TYPES,
  type FlowStepType,
  type UserAssessmentStatus,
} from '@ffp/core';

import { AssessmentStepRenderer } from '@web/components/assessment/AssessmentStepRenderer/AssessmentStepRenderer';
import { ErrorRetryState, LoadingState } from '@web/components/molecules';
import { routes, RouteKey } from '@web/config/routes';
import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import {
  useAssessmentTemplateQuery,
  useShowRefusedAnswers,
  useStartAssessment,
  useSubmitAssessment,
} from '@web/hooks/assessments';
import { useReplaceProgrammeMutation } from '@web/hooks/programmes';
import { toQuestionFieldErrors } from '@web/utils/assessment-field-errors';

import { REASSESSMENT_START_KEY } from './assessment.constants';

interface AssessmentOrchestratorProps {
  /** Assessment flow ID to start or resume */
  flowId: string;
  /** Whether this assessment is a reassessment (user already has a programme) */
  isReassessment?: boolean;
}

/** Statuses indicating the assessment has already been submitted (skip re-submission on resume). */
const ALREADY_SUBMITTED_STATUSES: UserAssessmentStatus[] = ['submitted', 'scored', 'completed'];

/** Safely parse a string to FlowStepType, returning fallback if invalid. */
const toFlowStepType = (value: string, fallback: FlowStepType): FlowStepType => {
  const result = flowStepTypeSchema.safeParse(value);

  return result.success ? result.data : fallback;
};

/**
 * Assessment orchestrator component.
 *
 * Handles the full lifecycle of an assessment session:
 * - Starts or resumes the assessment on mount via `useStartAssessment`
 * - Dispatches `START_ASSESSMENT` to populate context state
 * - Fetches template questions for the current step (question/video types)
 * - Passes questions to `AssessmentStepRenderer` for step-by-step rendering
 *
 */
export const AssessmentOrchestrator: React.FC<AssessmentOrchestratorProps> = ({
  flowId,
  isReassessment = false,
}) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const navigate = useNavigate();

  // Tracks whether this assessment has already been submitted (prevents re-submission on resume).
  const hasSubmittedRef = useRef(false);

  const {
    mutate: startMutate,
    variables: startVariables,
    isPending: isStartPending,
    isError: isStartError,
  } = useStartAssessment({
    onSuccess: (data) => {
      const currentStepSummary = data.steps.find((s) => s.order === data.currentStep);

      // If resuming an already-submitted assessment, skip submission
      if (ALREADY_SUBMITTED_STATUSES.includes(data.status)) {
        hasSubmittedRef.current = true;
      }

      assessmentDispatch({
        type: ASSESSMENT_ACTION.START_ASSESSMENT,
        payload: {
          assessmentId: data.assessmentId,
          currentStep: data.currentStep,
          currentStepId: data.currentStepId ?? currentStepSummary?.id ?? null,
          totalSteps: data.steps.length,
          steps: data.steps,
          answers: data.answers,
          phase: currentStepSummary ? toFlowStepType(currentStepSummary.type, 'intro') : 'intro',
        },
      });
    },
  });

  const showRefusedAnswers = useShowRefusedAnswers();
  const [isRefusalUnshown, setIsRefusalUnshown] = useState(false);

  const {
    mutate: submitMutate,
    isPending: isSubmitPending,
    error: submitError,
  } = useSubmitAssessment({
    onSuccess: () => {
      hasSubmittedRef.current = true;
      assessmentDispatch({ type: ASSESSMENT_ACTION.NEXT_STEP });
    },
    onError: (error) => {
      void showRefusedAnswers(toQuestionFieldErrors(error)).then((isShown) => {
        setIsRefusalUnshown(!isShown);
      });
    },
  });

  // A refusal shown on its questions takes the member back to them rather than to a failure
  // screen; any other failure, or a refusal naming no question the flow shows, gets the screen
  const isSubmitFailure =
    submitError !== null &&
    (Object.keys(toQuestionFieldErrors(submitError)).length === 0 || isRefusalUnshown);

  const {
    mutate: replaceMutate,
    isPending: isReplacePending,
    isError: isReplaceError,
  } = useReplaceProgrammeMutation({
    onSuccess: () => {
      void navigate(routes[RouteKey.PROGRAMME_OVERVIEW].path);
    },
  });

  // Start or resume assessment on mount (or if flowId changes).
  // The sessionStorage flag distinguishes an intentional CTA click (fresh start)
  // from a page reload (which should resume the in-progress assessment).
  useEffect(() => {
    const isFreshStart = sessionStorage.getItem(REASSESSMENT_START_KEY) === 'true';
    sessionStorage.removeItem(REASSESSMENT_START_KEY);

    const shouldStartNew = isReassessment && isFreshStart;

    startMutate({ flowId, isReassessment: shouldStartNew || undefined });
  }, [startMutate, flowId, isReassessment]);

  // Resolve current step to determine if questions are needed
  const currentStepSummary = useMemo(
    () => assessmentState.steps.find((s) => s.id === assessmentState.currentStepId),
    [assessmentState.steps, assessmentState.currentStepId]
  );

  const stepType = currentStepSummary
    ? toFlowStepType(currentStepSummary.type, assessmentState.phase)
    : assessmentState.phase;
  const needsQuestions = TEMPLATE_LINKED_STEP_TYPES.includes(stepType);
  const templateId = currentStepSummary?.templateId ?? null;

  // Fetch template questions for question/video-assessment steps
  const {
    data: template,
    error: templateError,
    refetch: refetchTemplate,
  } = useAssessmentTemplateQuery(templateId ?? '', {
    enabled: needsQuestions && !!templateId,
  });

  const questions = useMemo(
    () => (needsQuestions && template ? template.templateQuestions : []),
    [needsQuestions, template]
  );

  // Determine if the current step is the last question/video step in the flow.
  // Used to show "Complete Assessment" CTA instead of "Continue" on the final question.
  const isLastSubmittableStep = useMemo(() => {
    if (!TEMPLATE_LINKED_STEP_TYPES.includes(stepType)) {
      return false;
    }

    const currentOrder = currentStepSummary?.order ?? 0;

    return !assessmentState.steps.some(
      (s) =>
        s.order > currentOrder &&
        TEMPLATE_LINKED_STEP_TYPES.includes(toFlowStepType(s.type, 'intro'))
    );
  }, [stepType, currentStepSummary?.order, assessmentState.steps]);

  // User-initiated submission: sends all answers for scoring.
  // Called when user clicks "Complete Assessment" on the final question.
  // Submit onSuccess dispatches NEXT_STEP to transition to the results phase.
  const handleSubmitAssessment = useCallback(() => {
    if (!assessmentState.assessmentId) {
      return;
    }

    setIsRefusalUnshown(false);
    submitMutate({
      assessmentId: assessmentState.assessmentId,
      payload: { answers: assessmentState.answers },
    });
  }, [assessmentState.assessmentId, assessmentState.answers, submitMutate]);

  const handleViewProgramme = useCallback(() => {
    void navigate(routes[RouteKey.PROGRAMME_OVERVIEW].path);
  }, [navigate]);

  const handleKeepProgramme = useCallback(() => {
    void navigate(routes[RouteKey.PROGRAMME_OVERVIEW].path);
  }, [navigate]);

  const handleReplaceProgramme = useCallback(() => {
    if (!assessmentState.assessmentId) {
      return;
    }

    replaceMutate(assessmentState.assessmentId);
  }, [assessmentState.assessmentId, replaceMutate]);

  // Loading state: starting or resuming assessment
  if (isStartPending) {
    return <LoadingState layout="screen" message="Loading your assessment..." />;
  }

  if (isStartError) {
    return (
      <ErrorRetryState
        layout="screen"
        title="We couldn't load your assessment just now."
        // Retry with the same arguments: the fresh-start flag was cleared from sessionStorage on mount
        onRetry={() => {
          startMutate(startVariables);
        }}
      />
    );
  }

  if (needsQuestions && templateError && !template) {
    return (
      <ErrorRetryState
        layout="screen"
        title="We couldn't load the questions just now."
        onRetry={() => {
          void refetchTemplate();
        }}
      />
    );
  }

  if (isSubmitPending) {
    return <LoadingState layout="screen" message="Submitting your assessment..." />;
  }

  if (isSubmitFailure) {
    return (
      <ErrorRetryState
        layout="screen"
        title="We couldn't send your answers just now."
        onRetry={handleSubmitAssessment}
      />
    );
  }

  return (
    <AssessmentStepRenderer
      questions={questions}
      onViewProgramme={handleViewProgramme}
      isLastSubmittableStep={isLastSubmittableStep}
      onSubmitAssessment={handleSubmitAssessment}
      isReassessment={isReassessment}
      onKeepProgramme={handleKeepProgramme}
      onReplaceProgramme={handleReplaceProgramme}
      isReplacing={isReplacePending}
      hasReplaceFailed={isReplaceError}
    />
  );
};
