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
  /** Whether this assessment is a reassessment (user already has a programme) */
  isReassessment?: boolean;
  /** Callback when user chooses to keep their current programme (reassessment only) */
  onKeepProgramme?: () => void;
  /** Callback when user chooses to replace their programme (reassessment only) */
  onReplaceProgramme?: () => void;
  /** Whether the replace programme mutation is in progress */
  isReplacing?: boolean;
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
  /** Whether this assessment is a reassessment (user already has a programme) */
  isReassessment?: boolean;
  /** Callback when user chooses to keep their current programme (reassessment only) */
  onKeepProgramme?: () => void;
  /** Callback when user chooses to replace their programme (reassessment only) */
  onReplaceProgramme?: () => void;
  /** Whether the replace programme mutation is in progress */
  isReplacing?: boolean;
}
