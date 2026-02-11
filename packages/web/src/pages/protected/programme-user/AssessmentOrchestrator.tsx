import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { flowStepTypeSchema, type FlowStepType, type UserAssessmentStatus } from '@ffp/core';

import { AssessmentStepRenderer } from '@web/components/assessment/AssessmentStepRenderer/AssessmentStepRenderer';
import { Button } from '@web/components/button';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';
import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import {
  useAssessmentTemplateQuery,
  useStartAssessment,
  useSubmitAssessment,
} from '@web/hooks/assessments';
import { routes, RouteKey } from '@web/pages/routes';

interface AssessmentOrchestratorProps {
  /** Assessment flow ID to start or resume */
  flowId: string;
}

/** Step types that require template questions to be fetched. */
const QUESTION_STEP_TYPES: FlowStepType[] = ['questions', 'video-assessment'];

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
export const AssessmentOrchestrator: React.FC<AssessmentOrchestratorProps> = ({ flowId }) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const navigate = useNavigate();

  // Tracks whether this assessment has already been submitted (prevents re-submission on resume).
  const hasSubmittedRef = useRef(false);

  const {
    mutate: startMutate,
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

  const {
    mutate: submitMutate,
    isPending: isSubmitPending,
    isError: isSubmitError,
  } = useSubmitAssessment({
    onSuccess: () => {
      hasSubmittedRef.current = true;
      assessmentDispatch({ type: ASSESSMENT_ACTION.NEXT_STEP });
    },
  });

  // Start or resume assessment on mount (or if flowId changes).
  // mutate is referentially stable (useCallback([observer]) in TanStack Query v5).
  useEffect(() => {
    startMutate({ flowId });
  }, [startMutate, flowId]);

  // Resolve current step to determine if questions are needed
  const currentStepSummary = useMemo(
    () => assessmentState.steps.find((s) => s.id === assessmentState.currentStepId),
    [assessmentState.steps, assessmentState.currentStepId]
  );

  const stepType = currentStepSummary
    ? toFlowStepType(currentStepSummary.type, assessmentState.phase)
    : assessmentState.phase;
  const needsQuestions = QUESTION_STEP_TYPES.includes(stepType);
  const templateId = currentStepSummary?.templateId ?? null;

  // Fetch template questions for question/video-assessment steps
  const { data: template, error: templateError } = useAssessmentTemplateQuery(templateId ?? '', {
    enabled: needsQuestions && !!templateId,
  });

  const questions = useMemo(
    () => (needsQuestions && template ? template.templateQuestions : []),
    [needsQuestions, template]
  );

  // Determine if the current step is the last question/video step in the flow.
  // Used to show "Complete Assessment" CTA instead of "Continue" on the final question.
  const isLastSubmittableStep = useMemo(() => {
    if (!QUESTION_STEP_TYPES.includes(stepType)) {
      return false;
    }

    const currentOrder = currentStepSummary?.order ?? 0;

    return !assessmentState.steps.some(
      (s) => s.order > currentOrder && QUESTION_STEP_TYPES.includes(toFlowStepType(s.type, 'intro'))
    );
  }, [stepType, currentStepSummary?.order, assessmentState.steps]);

  // User-initiated submission: sends all answers for scoring.
  // Called when user clicks "Complete Assessment" on the final question.
  // Submit onSuccess dispatches NEXT_STEP to transition to the results phase.
  const handleSubmitAssessment = useCallback(() => {
    if (!assessmentState.assessmentId) {
      return;
    }

    submitMutate({
      assessmentId: assessmentState.assessmentId,
      payload: { answers: assessmentState.answers },
    });
  }, [assessmentState.assessmentId, assessmentState.answers, submitMutate]);

  const handleViewProgramme = useCallback(() => {
    void navigate(routes[RouteKey.PROGRAMME_OVERVIEW].path);
  }, [navigate]);

  // Loading state: starting or resuming assessment
  if (isStartPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" variant="center" />

        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Loading your assessment...
        </Text>
      </div>
    );
  }

  // Error state: start assessment failed
  if (isStartError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <StaticAlert
          variant="error"
          message="Unable to start the assessment. Please try again later."
        />

        <Button
          variant="secondary"
          onClick={() => {
            startMutate({ flowId });
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Error state: template questions failed to load
  if (needsQuestions && templateError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <StaticAlert
          variant="error"
          message="Unable to load assessment questions. Please try again later."
        />
      </div>
    );
  }

  // Submission loading state: submitting assessment answers
  if (isSubmitPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" variant="center" />

        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Submitting your assessment...
        </Text>
      </div>
    );
  }

  // Submission error state
  if (isSubmitError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <StaticAlert
          variant="error"
          message="Unable to submit your assessment. Please try again."
        />

        <Button
          variant="secondary"
          onClick={() => {
            if (assessmentState.assessmentId) {
              submitMutate({
                assessmentId: assessmentState.assessmentId,
                payload: { answers: assessmentState.answers },
              });
            }
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <AssessmentStepRenderer
      questions={questions}
      onViewProgramme={handleViewProgramme}
      isLastSubmittableStep={isLastSubmittableStep}
      onSubmitAssessment={handleSubmitAssessment}
    />
  );
};
