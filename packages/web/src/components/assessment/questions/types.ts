import type { AssessmentQuestion, AnswerValue } from '@ffp/core';

/** Common props interface for all question renderer components. */
export interface QuestionComponentProps {
  /** Question definition from the assessment template */
  question: AssessmentQuestion;
  /** Current answer value (undefined if not yet answered) */
  value: AnswerValue | undefined;
  /** Callback fired when the answer changes */
  onChange: (value: AnswerValue) => void;
  /** Whether the question input is disabled */
  disabled?: boolean;
  /** Validation error message to display */
  error?: string;
}
