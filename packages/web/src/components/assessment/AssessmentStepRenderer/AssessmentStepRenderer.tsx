import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AnswerValue, FlowStepConfig, FlowStepType } from '@ffp/core';

import { AssessmentProgress } from '@web/components/AssessmentProgress';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';
import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import { useAssessmentFlowQuery } from '@web/hooks/assessments';

import { TransitionCard } from '../cards/TransitionCard';
import { IntroScreen } from '../screens/IntroScreen';

import { ProgrammeOverviewPlaceholder } from './ProgrammeOverviewPlaceholder';
import { QuestionStepContent } from './QuestionStepContent';
import { ResultsStepContent } from './ResultsStepContent';
import { VideoStepContent } from './VideoStepContent';

import type { AssessmentStepRendererProps } from './types';

const STEPS_WITHOUT_PROGRESS: FlowStepType[] = ['intro', 'programme-overview'];

/**
 * Orchestrator that renders the correct card/screen based on step type.
 *
 * Reads state from `useAssessment()` context and resolves the current step's
 * full config from the flow query. Renders `AssessmentProgress` for all types
 * except `intro` and `programme-overview`.
 */
export const AssessmentStepRenderer: React.FC<AssessmentStepRendererProps> = ({
  questions = [],
  onViewProgramme,
  isLastSubmittableStep = false,
  onSubmitAssessment,
}) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const { data: flow, isLoading: isFlowLoading } = useAssessmentFlowQuery(assessmentState.flowId);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    setQuestionIndex(0);
  }, [assessmentState.currentStepId]);

  const currentStepSummary = useMemo(
    () => assessmentState.steps.find((s) => s.id === assessmentState.currentStepId),
    [assessmentState.steps, assessmentState.currentStepId]
  );

  const flowStep = useMemo(
    () => flow?.steps.find((s) => s.order === currentStepSummary?.order),
    [flow?.steps, currentStepSummary?.order]
  );

  const config: FlowStepConfig = useMemo(
    () => flowStep?.config ?? { title: currentStepSummary?.config.title ?? '' },
    [flowStep?.config, currentStepSummary?.config.title]
  );

  const stepType = (currentStepSummary?.type ?? assessmentState.phase) as FlowStepType;
  const showProgress = !STEPS_WITHOUT_PROGRESS.includes(stepType);

  const handleStart = useCallback(() => {
    assessmentDispatch({ type: ASSESSMENT_ACTION.NEXT_STEP });
  }, [assessmentDispatch]);

  const handleAnswer = useCallback(
    (questionId: string, value: AnswerValue | null) => {
      if (value !== null) {
        assessmentDispatch({
          type: ASSESSMENT_ACTION.SET_ANSWER,
          payload: { questionId, answer: { questionId, answerValue: value } },
        });
      }
    },
    [assessmentDispatch]
  );

  if (isFlowLoading || !currentStepSummary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" variant="center" />
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Loading assessment...
        </Text>
      </div>
    );
  }

  const renderStepContent = (): JSX.Element => {
    switch (stepType) {
      case 'intro':
        return <IntroScreen config={config} onStart={handleStart} />;

      case 'transition':
        return (
          <div className="mx-auto max-w-3xl">
            <TransitionCard config={config} />
          </div>
        );

      case 'questions':
        return (
          <QuestionStepContent
            config={config}
            questions={questions}
            questionIndex={questionIndex}
            onQuestionIndexChange={setQuestionIndex}
            answers={assessmentState.answers}
            currentStep={assessmentState.currentStep}
            onAnswer={handleAnswer}
            isLastSubmittableStep={isLastSubmittableStep}
            onSubmitAssessment={onSubmitAssessment}
          />
        );

      case 'video-assessment':
        return (
          <VideoStepContent
            config={config}
            questions={questions}
            questionIndex={questionIndex}
            onQuestionIndexChange={setQuestionIndex}
            answers={assessmentState.answers}
            currentStep={assessmentState.currentStep}
            onAnswer={handleAnswer}
            isLastSubmittableStep={isLastSubmittableStep}
            onSubmitAssessment={onSubmitAssessment}
          />
        );

      case 'results':
        return (
          <ResultsStepContent
            config={config}
            assessmentId={assessmentState.assessmentId}
            onViewProgramme={onViewProgramme}
          />
        );

      case 'programme-overview':
        return <ProgrammeOverviewPlaceholder />;

      default:
        return (
          <div className="py-8 text-center">
            <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
              Unknown step type: {stepType}
            </Text>
          </div>
        );
    }
  };

  // Steps without a progress bar (intro, programme-overview) are vertically centred on the page.
  if (!showProgress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        {renderStepContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssessmentProgress
        currentStep={assessmentState.currentStep}
        totalSteps={assessmentState.totalSteps}
        phase={assessmentState.phase}
      />
      {renderStepContent()}
    </div>
  );
};
