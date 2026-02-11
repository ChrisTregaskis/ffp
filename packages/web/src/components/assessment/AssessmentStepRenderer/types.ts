import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

export interface AssessmentStepRendererProps {
  /** Questions for the current question/video step (provided by parent) */
  questions?: AssessmentQuestion[];
  /** Callback when user clicks "View My Programme" on results screen */
  onViewProgramme?: () => void;
  /** Whether the current step is the last question/video step in the flow */
  isLastSubmittableStep?: boolean;
  /** Callback to submit the assessment (triggered by user clicking "Complete Assessment") */
  onSubmitAssessment?: () => void;
}

export interface QuestionStepContentProps {
  config: FlowStepConfig;
  questions: AssessmentQuestion[];
  questionIndex: number;
  onQuestionIndexChange: (index: number | ((prev: number) => number)) => void;
  answers: Record<string, { questionId: string; answerValue: AnswerValue }>;
  currentStep: number;
  onAnswer: (questionId: string, value: AnswerValue | null) => void;
  /** Whether the current step is the last question/video step in the flow */
  isLastSubmittableStep?: boolean;
  /** Callback to submit the assessment (triggered by user clicking "Complete Assessment") */
  onSubmitAssessment?: () => void;
}

export interface ResultsStepContentProps {
  config: FlowStepConfig;
  assessmentId: string | null;
  onViewProgramme?: () => void;
}
