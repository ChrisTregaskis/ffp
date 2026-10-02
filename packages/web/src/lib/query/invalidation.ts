import type { SplitIdentifierVariables } from '@web/lib/api/client';

import type { QueryClient } from '@tanstack/react-query';

interface ListDetailKeys {
  lists: () => readonly unknown[];
  detail: (publicId: string) => readonly unknown[];
}

/**
 * Refresh a resource's lists after a write, plus its own detail entry.
 *
 * Takes the variables object because `id` and `publicId` are both strings:
 * passing the wrong one type-checks and then invalidates nothing.
 *
 * Two calls rather than one on the root key, which would also refetch every
 * other record's detail.
 */
export const invalidateListsAndDetail = (
  queryClient: QueryClient,
  keys: ListDetailKeys,
  { publicId }: Pick<SplitIdentifierVariables<unknown>, 'publicId'>
): void => {
  void queryClient.invalidateQueries({ queryKey: keys.lists() });

  if (publicId) {
    void queryClient.invalidateQueries({ queryKey: keys.detail(publicId) });
  }
};
