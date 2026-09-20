/** Separate from `assessmentFlowKeys` — a flow edit must not invalidate templates. */
export const assessmentTemplateKeys = {
  all: ['assessment-templates'] as const,
  lists: () => [...assessmentTemplateKeys.all, 'list'] as const,
  list: (activeOnly: boolean) => [...assessmentTemplateKeys.lists(), { activeOnly }] as const,
};
