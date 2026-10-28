import { createEntityKeys } from './create-entity-keys';

const base = createEntityKeys('users');

export const userKeys = {
  ...base,
  /** Authenticated user's profile */
  me: () => [...base.all, 'me'] as const,
  /** A member's current programme, under their detail key so invalidating the user clears it */
  programme: (publicId: string) => [...base.detail(publicId), 'programme'] as const,
};
