import type {
  CreateProgrammeTemplateInput,
  TemplateDetailResponse,
  UpdateProgrammeTemplateInput,
} from '@ffp/core';

import type { TemplateMetadataFormValues } from '@web/components/programme-templates';

export const EMPTY_TEMPLATE_VALUES: TemplateMetadataFormValues = {
  name: '',
  slug: '',
  description: '',
  difficulty: '',
  isActive: 'true',
};

export const toTemplateFormValues = (
  template: TemplateDetailResponse
): TemplateMetadataFormValues => ({
  name: template.name,
  slug: template.slug,
  description: template.description ?? '',
  difficulty: template.difficulty,
  isActive: String(template.isActive),
});

/** Only the fields that differ from the stored template; an empty object means nothing changed. */
export const toUpdateTemplateInput = (
  values: TemplateMetadataFormValues,
  template: TemplateDetailResponse
): UpdateProgrammeTemplateInput => {
  const payload: UpdateProgrammeTemplateInput = {};
  const name = values.name.trim();
  const slug = values.slug.trim();

  if (name !== template.name) {
    payload.name = name;
  }

  if (slug !== template.slug) {
    payload.slug = slug;
  }

  const descValue = values.description.trim() || null;

  if (descValue !== (template.description ?? null)) {
    payload.description = descValue;
  }

  if (values.difficulty !== template.difficulty) {
    payload.difficulty = values.difficulty as UpdateProgrammeTemplateInput['difficulty'];
  }

  const newIsActive = values.isActive === 'true';

  if (newIsActive !== template.isActive) {
    payload.isActive = newIsActive;
  }

  return payload;
};

export const toCreateTemplateInput = (
  values: TemplateMetadataFormValues
): CreateProgrammeTemplateInput => ({
  name: values.name.trim(),
  slug: values.slug.trim(),
  difficulty: values.difficulty as CreateProgrammeTemplateInput['difficulty'],
  description: values.description.trim() || undefined,
});

/** An edit that takes the template out of use, which the page confirms before saving */
export const deactivatesTemplate = (
  values: TemplateMetadataFormValues,
  template: TemplateDetailResponse
): boolean => toUpdateTemplateInput(values, template).isActive === false;
