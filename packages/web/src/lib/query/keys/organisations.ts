export const organisationKeys = {
  all: ['organisations'] as const,
  lists: () => [...organisationKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...organisationKeys.lists(), params] as const,
  details: () => [...organisationKeys.all, 'detail'] as const,
  detail: (organisationId: string) => [...organisationKeys.details(), organisationId] as const,
};
