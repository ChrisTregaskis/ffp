import type { AssessmentQuestion, AnswerValue } from '@ffp/core';

/** Common props interface for all question renderer components. */
export interface QuestionComponentProps {
  /** Question definition from the assessment template */
  question: AssessmentQuestion;
  /** Current answer value (null when not yet answered or cleared) */
  value: AnswerValue | null;
  /** Callback fired when the answer changes (null when field is intentionally cleared) */
  onChange: (value: AnswerValue | null) => void;
  /** Whether the question input is disabled */
  disabled?: boolean;
  /** Validation error message to display */
  error?: string;
}
