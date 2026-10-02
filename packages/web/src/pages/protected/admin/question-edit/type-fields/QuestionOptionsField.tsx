import React, { useEffect, useRef } from 'react';
import { useFieldArray } from 'react-hook-form';

import { Button } from '@web/components/button';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { Icon } from '@web/components/Icon';
import { Text, Title } from '@web/components/text';

import { EMPTY_OPTION } from '../question-form-values';

import { QuestionOptionRow } from './QuestionOptionRow';

import type { QuestionFormValues } from '../types';

const MIN_OPTIONS = 2;

/** The answer options of a choice question, in the order the member sees them. */
export const QuestionOptionsField: React.FC = () => {
  const { control, watch } = useComposableFormContext<QuestionFormValues>();
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'options' });
  const isScored = watch('scoreDimension') !== '';
  const hasStoredOptions = watch('options').some((option) => option.isStored);

  // Switching to a choice type from one without options leaves nothing to fill in.
  // The ref, not `fields.length`, stops a strict-mode re-run appending a second pair.
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!hasSeeded.current && fields.length === 0) {
      append([EMPTY_OPTION, EMPTY_OPTION]);
    }

    hasSeeded.current = true;
  }, [fields.length, append]);

  return (
    <section className="mb-4">
      <Title as="h3" className="mb-1">
        Answer options and scores
      </Title>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-3">
        {isScored
          ? 'An answer adds its option’s score to the scored dimension, and those totals set the member’s level.'
          : 'Scores only count once the question scores a dimension — choose one above to use them.'}
      </Text>
      {hasStoredOptions && (
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="-mt-2 mb-3">
          A saved option’s stored value is fixed, because branching rules and members’ past answers
          match on it. Removing a saved option stops those matching too.
        </Text>
      )}

      {fields.map((field, index) => (
        <QuestionOptionRow
          key={field.id}
          index={index}
          isFirst={index === 0}
          isLast={index === fields.length - 1}
          canRemove={fields.length > MIN_OPTIONS}
          onMoveUp={() => {
            swap(index, index - 1);
          }}
          onMoveDown={() => {
            swap(index, index + 1);
          }}
          onRemove={() => {
            remove(index);
          }}
        />
      ))}

      <Button
        variant="secondary"
        size="sm"
        icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
        onClick={() => {
          append(EMPTY_OPTION);
        }}
      >
        Add option
      </Button>
    </section>
  );
};
