import { createEntityKeys } from './create-entity-keys';

const base = createEntityKeys('users');

export const userKeys = {
  ...base,
  /** Authenticated user's profile */
  me: () => [...base.all, 'me'] as const,
};
