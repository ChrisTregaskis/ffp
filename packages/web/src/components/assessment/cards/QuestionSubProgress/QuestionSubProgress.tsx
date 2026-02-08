import { Text } from '@web/components/text';

export interface QuestionSubProgressProps {
  /** 1-based question number */
  questionNumber: number;
  /** Total number of questions in this step */
  totalQuestions: number;
}

/**
 * Question sub-progress indicator for assessment cards.
 *
 * Displays "Question X of Y" label with a visual progress bar
 * and remaining count. Uses the same gradient as AssessmentProgress.
 */
export const QuestionSubProgress: React.FC<QuestionSubProgressProps> = ({
  questionNumber,
  totalQuestions,
}) => {
  const percentage = totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0;
  const remaining = totalQuestions - questionNumber;

  return (
    <div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue transition-all duration-300 ease-out"
            style={{ width: `${String(percentage)}%` }}
          />
        </div>
        <Text
          as="span"
          styleProps={{ size: 'xs', colour: 'muted-foreground' }}
          className="shrink-0"
        >
          {remaining}/{totalQuestions}
        </Text>
      </div>
    </div>
  );
};
