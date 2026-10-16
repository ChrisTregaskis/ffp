import { isAnswerRequired, type AssessmentQuestion } from '@ffp/core';

import { RequiredIndicator, Text } from '@web/components/atoms';

export interface QuestionHeaderProps {
  question: AssessmentQuestion;
  /** Lets a control name itself by the question text (`aria-labelledby`) */
  textId?: string;
  descriptionId?: string;
}

/** A question's text, required marker and description. */
export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  textId,
  descriptionId,
}) => (
  <div className="space-y-1">
    <Text
      as="p"
      id={textId}
      styleProps={{ size: 'xl', weight: 'medium', colour: 'foreground' }}
      className="leading-relaxed"
    >
      {question.question}
      {isAnswerRequired(question.validation) && <RequiredIndicator />}
    </Text>

    {question.description && (
      <Text as="p" id={descriptionId} styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        {question.description}
      </Text>
    )}
  </div>
);
