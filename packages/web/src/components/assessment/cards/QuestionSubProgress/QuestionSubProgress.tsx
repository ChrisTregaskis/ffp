import { ProgressBar, Text } from '@web/components/atoms';

export interface QuestionSubProgressProps {
  /** 1-based question number */
  questionNumber: number;
  /** Total number of questions in this step */
  totalQuestions: number;
}

/**
 * Question sub-progress indicator for assessment cards.
 *
 * A thin progress bar with an "X/Y" count beside it.
 */
export const QuestionSubProgress: React.FC<QuestionSubProgressProps> = ({
  questionNumber,
  totalQuestions,
}) => {
  const percentage = totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0;

  return (
    <div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar
          percent={percentage}
          size="sm"
          className="flex-1"
          aria-label={`Question ${String(questionNumber)} of ${String(totalQuestions)}`}
          animateFromZero={false}
          duration={0.3}
          delay={0}
        />
        <Text
          as="span"
          styleProps={{ size: 'xs', colour: 'muted-foreground' }}
          className="shrink-0"
        >
          {questionNumber}/{totalQuestions}
        </Text>
      </div>
    </div>
  );
};
