import type { TemplateDetailResponse, UpdateProgrammeTemplateInput } from '@ffp/core';

import type { TemplateMetadataFormValues } from '@web/components/programme-templates';

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

  if (values.name !== template.name) {
    payload.name = values.name;
  }

  if (values.slug !== template.slug) {
    payload.slug = values.slug;
  }

  const descValue = values.description || null;

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
