import React, { useEffect, useRef } from 'react';

import type { AdminQuestionDetail } from '@ffp/core';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { FormToggle } from '@web/components/form/standardForm/FormToggle';
import {
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_OPTIONS,
  SCORE_DIMENSION_OPTIONS,
} from '@web/components/questions';
import { Text } from '@web/components/text';
import { toSlug } from '@web/utils/string';

import { QuestionTypeChangeWarning } from './QuestionTypeChangeWarning';
import { QuestionTypeFields } from './QuestionTypeFields';

import type { QuestionFormValues } from './types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 100;

export interface QuestionFormFieldsProps {
  isEditMode: boolean;
  /** The stored question, when editing — the type-change warning compares against it */
  record?: AdminQuestionDetail;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

/** The fields every question shares, then whatever the chosen type adds. */
export const QuestionFormFields: React.FC<QuestionFormFieldsProps> = ({
  isEditMode,
  record,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors, watch, setValue, getValues } =
    useComposableFormContext<QuestionFormValues>();

  const type = watch('type');
  const questionText = watch('questionText');

  // The slug follows the text until the author edits it; it is fixed once the question exists
  const lastAutoSlug = useRef('');

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    const currentSlug = getValues('slug');
    const nextSlug = toSlug(questionText).slice(0, SLUG_MAX_LENGTH).replace(/-$/, '');

    if (currentSlug === lastAutoSlug.current || currentSlug === '') {
      setValue('slug', nextSlug);
      lastAutoSlug.current = nextSlug;
    }
  }, [isEditMode, questionText, setValue, getValues]);

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      <FormTextInput<QuestionFormValues>
        name="questionText"
        label="Question"
        placeholder="e.g. How often do you do something active in a week?"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please write the question' }}
      />

      <FormTextInput<QuestionFormValues>
        name="slug"
        label="Slug"
        placeholder="e.g. weekly-activity"
        register={register}
        errors={errors}
        isRequired
        disabled={isEditMode}
        registerOptions={{
          required: 'Please give the question a slug',
          maxLength: {
            value: SLUG_MAX_LENGTH,
            message: `Keep the slug to ${String(SLUG_MAX_LENGTH)} characters`,
          },
          pattern: {
            value: SLUG_PATTERN,
            message: 'Use lowercase letters, numbers and single hyphens',
          },
        }}
      />
      {isEditMode && (
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="-mt-3 mb-4">
          The slug is fixed once a question exists, because flows and scoring refer to it.
        </Text>
      )}

      <FormTextarea<QuestionFormValues>
        name="description"
        label="Helper text"
        placeholder="Optional guidance shown under the question"
        register={register}
        errors={errors}
        rows={2}
      />

      <FormRow>
        <FormSelect<QuestionFormValues>
          name="type"
          label="Question type"
          options={QUESTION_TYPE_OPTIONS}
          control={control}
          errors={errors}
          isRequired
        />
        <FormSelect<QuestionFormValues>
          name="scoreDimension"
          label="Scores towards"
          options={SCORE_DIMENSION_OPTIONS}
          control={control}
          errors={errors}
        />
      </FormRow>

      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="-mt-2 mb-4">
        {QUESTION_TYPE_DESCRIPTIONS[type]}
      </Text>

      {record && <QuestionTypeChangeWarning stored={record} nextType={type} />}

      <FormToggle<QuestionFormValues>
        name="required"
        label="Answer required"
        hint="Members must answer before moving on"
        control={control}
      />

      <QuestionTypeFields type={type} />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Question'}
      />
    </>
  );
};
