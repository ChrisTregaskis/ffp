import type { TemplateDetailResponse } from '@ffp/core';

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
