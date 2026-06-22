import { Text } from '@web/components/text';

import { QUESTION_TYPE_LABELS } from './prototype-labels';

import type { QuestionType } from './prototype-types';

interface QuestionTypeBadgeProps {
  type: QuestionType;
}

/** Small pill showing a question's type. */
export const QuestionTypeBadge: React.FC<QuestionTypeBadgeProps> = ({ type }) => (
  <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-0.5">
    <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'secondary' }}>
      {QUESTION_TYPE_LABELS[type]}
    </Text>
  </span>
);
