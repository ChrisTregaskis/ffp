import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';

import type { QuestionFormValues } from '../types';

/** How many options a member may pick — never more than there are to pick from. */
export const MaxSelectionsField: React.FC = () => {
  const { register, errors, getValues, watch } = useComposableFormContext<QuestionFormValues>();
  const optionCount = watch('options').length;

  const validate = (value: string): string | true => {
    if (value.trim() === '') {
      return true;
    }

    const cap = Number(value);
    const optionCount = getValues('options').length;

    if (!Number.isInteger(cap) || cap < 1) {
      return 'Enter a whole number of 1 or more';
    }

    return cap <= optionCount || `There are only ${String(optionCount)} options to pick from`;
  };

  return (
    <FormNumberInput<QuestionFormValues>
      name="maxSelections"
      label={`Most options a member can pick (up to ${String(optionCount)})`}
      placeholder="No limit"
      min={1}
      register={register}
      errors={errors}
      validate={validate}
    />
  );
};
