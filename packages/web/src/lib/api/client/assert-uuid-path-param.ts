import { z } from 'zod';

import { ApiError } from './errors';

const uuidSchema = z.guid();

const USER_MESSAGE = 'Something went wrong saving this record. Please refresh the page and retry.';

/**
 * Guards a path parameter for an endpoint that resolves by UUID.
 *
 * Postgres rejects a non-UUID string only when it reaches the comparison, so the
 * failure arrives as an opaque 500 (`22P02`, surfaced as "Database driver
 * error") naming nothing. Checking here names the call that sent the wrong
 * shape.
 *
 * The diagnostic goes to the console and to `details`, never to `message`: the
 * edit screens render `message` straight into their error banner.
 *
 * `SplitIdentifierVariables` is the other half of this contract: it is how a
 * caller carries both identifiers as far as the request.
 */
export const assertUuidPathParam = (value: string, endpoint: string): string => {
  if (!uuidSchema.safeParse(value).success) {
    const diagnostic = `${endpoint} expects a UUID but was given "${value}". Route parameters carry a publicId, so take the UUID from the fetched record instead.`;

    console.error(`[API] ${diagnostic}`);

    throw new ApiError(400, 'INVALID_IDENTIFIER', USER_MESSAGE, { endpoint, value, diagnostic });
  }

  return value;
};
