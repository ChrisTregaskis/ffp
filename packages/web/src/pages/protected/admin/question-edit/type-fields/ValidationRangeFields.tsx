import React from 'react';

import { Text, FormRow } from '@web/components/atoms';
import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

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
        <FormTextInput
          name="min"
          type="number"
          label={minLabel}
          placeholder={minPlaceholder}
          register={register}
          errors={errors}
          inputProps={{ step: 'any' }}
          registerOptions={{ validate: validateMin }}
        />
        <FormTextInput
          name="max"
          type="number"
          label={maxLabel}
          placeholder={maxPlaceholder}
          register={register}
          errors={errors}
          inputProps={{ step: 'any' }}
          registerOptions={{ deps: ['min'] }}
        />
      </FormRow>
    </>
  );
};
