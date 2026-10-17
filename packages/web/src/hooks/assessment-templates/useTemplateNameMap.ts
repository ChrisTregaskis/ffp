import { useMemo } from 'react';

import { useAssessmentTemplatesQuery } from './useAssessmentTemplatesQuery';

export interface TemplateNameMap {
  /** Template names keyed by template UUID, for resolving a step's `templateId` */
  templateNames: Map<string, string>;
  /** The catalogue has not arrived, so an absent name means "not loaded", not "not linked" */
  isPending: boolean;
}

/**
 * Template names for resolving a step's `templateId`. Reads the whole catalogue
 * rather than the active subset, so a retired template's name still renders.
 */
export const useTemplateNameMap = (): TemplateNameMap => {
  const { data: templates, isPending } = useAssessmentTemplatesQuery();

  const templateNames = useMemo(
    () => new Map((templates ?? []).map((template) => [template.id, template.name])),
    [templates]
  );

  return { templateNames, isPending };
};
