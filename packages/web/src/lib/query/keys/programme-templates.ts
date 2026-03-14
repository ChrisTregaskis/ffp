export const programmeTemplateKeys = {
  all: ['programme-templates'] as const,
  lists: () => [...programmeTemplateKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...programmeTemplateKeys.lists(), params] as const,
  details: () => [...programmeTemplateKeys.all, 'detail'] as const,
  detail: (templateId: string) => [...programmeTemplateKeys.details(), templateId] as const,
};
