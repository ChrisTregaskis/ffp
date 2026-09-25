import React, { useMemo } from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import type { SelectOption } from '@web/components/select/types';
import { useAssessmentTemplatesQuery } from '@web/hooks/assessment-templates';

import type { FlowStepFormValues } from './flow-step-form-values';

const RETIRED_TEMPLATE_MESSAGE =
  'The template this step uses has been retired, so the step cannot be saved until another is chosen.';

/**
 * The value is the template's UUID, not its publicId — `template_id` is a
 * foreign key, unlike every other identifier on this surface.
 *
 * Loads the whole catalogue, not just the active slice: a step can link a
 * template retired after it was authored, and filtering that out would blank
 * the field while the stored value stayed in form state.
 */
export const AssessmentTemplateField: React.FC = () => {
  const { control, errors, watch } = useComposableFormContext<FlowStepFormValues>();
  const { data: templates, isLoading, error } = useAssessmentTemplatesQuery();

  const selectedTemplateId = watch('templateId');

  const selectedIsRetired = useMemo(
    () =>
      !!selectedTemplateId &&
      (templates ?? []).some(
        (template) => template.id === selectedTemplateId && !template.isActive
      ),
    [templates, selectedTemplateId]
  );

  const options = useMemo<SelectOption[]>(
    () =>
      (templates ?? [])
        .filter((template) => template.isActive || template.id === selectedTemplateId)
        .map((template) => ({
          value: template.id,
          label: template.isActive ? template.name : `${template.name} (retired)`,
        })),
    [templates, selectedTemplateId]
  );

  if (error) {
    return (
      <StaticAlert
        variant="error"
        appearance="soft"
        message="Templates could not be loaded, so this step cannot be linked to one yet."
        className="mb-4"
      />
    );
  }

  return (
    <>
      {selectedIsRetired && (
        <StaticAlert
          variant="warning"
          appearance="soft"
          message={RETIRED_TEMPLATE_MESSAGE}
          className="mb-4"
        />
      )}

      <FormSelect<FlowStepFormValues>
        name="templateId"
        label="Linked template"
        options={options}
        placeholder={isLoading ? 'Loading templates…' : 'Select a template'}
        control={control}
        errors={errors}
        isRequired
        rules={{ required: 'Please choose the template this step draws its content from' }}
      />
    </>
  );
};
