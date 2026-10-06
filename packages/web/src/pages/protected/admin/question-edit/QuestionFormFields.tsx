import React from 'react';

import { QUESTION_SLUG_MAX_LENGTH, QUESTION_SLUG_PATTERN } from '@ffp/core';
import type { AdminQuestionDetail } from '@ffp/core';

import { FormRow } from '@web/components/atoms';
import {
  FormActions,
  StaticAlert,
  FormSelect,
  FormTextarea,
  FormTextInput,
  FormToggle,
} from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import {
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_OPTIONS,
  SCORE_DIMENSION_OPTIONS,
} from '@web/components/questions';
import { useAutoSlug } from '@web/hooks/useAutoSlug';

import { QuestionTypeChangeWarning } from './QuestionTypeChangeWarning';
import { QuestionTypeFields } from './QuestionTypeFields';

import type { QuestionFormValues } from './types';

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
  const { register, control, errors, watch } = useComposableFormContext<QuestionFormValues>();

  const type = watch('type');

  // The slug is fixed once the question exists, because flows and scoring refer to it
  useAutoSlug<QuestionFormValues>('questionText', 'slug', {
    enabled: !isEditMode,
    maxLength: QUESTION_SLUG_MAX_LENGTH,
  });

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
        hint={
          isEditMode
            ? 'The slug is fixed once a question exists, because flows and scoring refer to it.'
            : undefined
        }
        registerOptions={{
          required: 'Please give the question a slug',
          maxLength: {
            value: QUESTION_SLUG_MAX_LENGTH,
            message: `Keep the slug to ${String(QUESTION_SLUG_MAX_LENGTH)} characters`,
          },
          pattern: {
            value: QUESTION_SLUG_PATTERN,
            message: 'Use lowercase letters, numbers and single hyphens',
          },
        }}
      />

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
          hint={QUESTION_TYPE_DESCRIPTIONS[type]}
        />
        <FormSelect<QuestionFormValues>
          name="scoreDimension"
          label="Scores towards"
          options={SCORE_DIMENSION_OPTIONS}
          control={control}
          errors={errors}
        />
      </FormRow>

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
