import { z } from 'zod';

import { NotFoundError } from './errors.js';

/**
 * Refuses a UUID-keyed path parameter that is not UUID-shaped, before it reaches a uuid column
 * and fails as an unmapped 500 (`22P02`). A malformed id names nothing, so it is a 404 like any
 * other missing record, which a member page shows as not found rather than offering a retry.
 *
 * Only for parameters resolved by UUID: never a `publicId`, nor one that accepts either form.
 */
export const assertUuidOrNotFound = (value: string, resource: string): void => {
  if (!z.guid().safeParse(value).success) {
    throw new NotFoundError(resource);
  }
};
