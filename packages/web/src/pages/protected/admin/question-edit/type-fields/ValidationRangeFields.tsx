import React from 'react';

import { Text } from '@web/components/atoms';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';
import { FormRow } from '@web/components/form/standardForm/FormRow';

import type { QuestionFormValues } from '../types';

export interface ValidationRangeFieldsProps {
  minLabel: string;
  maxLabel: string;
  /** What the bounds mean for this type */
  hint: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

/** The lower and upper bound a type reads from `validation` — value, length or result. */
export const ValidationRangeFields: React.FC<ValidationRangeFieldsProps> = ({
  minLabel,
  maxLabel,
  hint,
  minPlaceholder = 'None',
  maxPlaceholder = 'None',
}) => {
  const { register, errors, getValues } = useComposableFormContext<QuestionFormValues>();

  const validateMin = (value: string): string | true => {
    const max = getValues('max');

    if (value.trim() === '' || max.trim() === '') {
      return true;
    }

    return (
      Number(value) <= Number(max) || `${minLabel} cannot be more than ${maxLabel.toLowerCase()}`
    );
  };

  return (
    <>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-2">
        {hint}
      </Text>
      <FormRow>
        <FormNumberInput<QuestionFormValues>
          name="min"
          label={minLabel}
          placeholder={minPlaceholder}
          step="any"
          register={register}
          errors={errors}
          validate={validateMin}
        />
        <FormNumberInput<QuestionFormValues>
          name="max"
          label={maxLabel}
          placeholder={maxPlaceholder}
          step="any"
          register={register}
          errors={errors}
          deps={['min']}
        />
      </FormRow>
    </>
  );
};
