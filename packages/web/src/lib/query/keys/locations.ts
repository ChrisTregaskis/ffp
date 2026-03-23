export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...locationKeys.lists(), params] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (locationId: string) => [...locationKeys.details(), locationId] as const,
};
