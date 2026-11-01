import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

import type { QuestionCardProps } from '../cards/QuestionCard';
import type { ComponentType } from 'react';

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
  /** Whether replacing the programme failed */
  hasReplaceFailed?: boolean;
}

export interface QuestionStepContentProps {
  /** The card each question renders in */
  card: ComponentType<QuestionCardProps>;
  config: FlowStepConfig;
  questions: AssessmentQuestion[];
  questionIndex: number;
  onQuestionIndexChange: (index: number | ((prev: number) => number)) => void;
  answers: Record<string, { questionId: string; answerValue: AnswerValue }>;
  /** The server's message per refused question, keyed by questionId */
  fieldErrors: Record<string, string>;
  /** Changes with each refusal, so a refused question is brought into view once per refusal */
  refusalCount: number;
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
  /** Whether replacing the programme failed */
  hasReplaceFailed?: boolean;
}
