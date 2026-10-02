/**
 * The list/detail key shape every paginated admin resource shares.
 *
 * Detail keys are built from a publicId, never the UUID — invalidating by the
 * wrong one matches nothing. See `.claude/rules/identifiers.md`.
 *
 * Literal tuples rather than inference, so each key's segments stay visible.
 */
export interface EntityKeys<TName extends string> {
  all: readonly [TName];
  lists: () => readonly [TName, 'list'];
  list: (params: Record<string, unknown>) => readonly [TName, 'list', Record<string, unknown>];
  details: () => readonly [TName, 'detail'];
  detail: (publicId: string) => readonly [TName, 'detail', string];
}

/**
 * Each level derives from the one above, so invalidating `lists()` clears every
 * page and filter while leaving cached details alone.
 */
export const createEntityKeys = <TName extends string>(name: TName): EntityKeys<TName> => {
  const keys: EntityKeys<TName> = {
    all: [name] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...keys.lists(), params] as const,
    details: () => [...keys.all, 'detail'] as const,
    detail: (publicId: string) => [...keys.details(), publicId] as const,
  };

  return keys;
};
