import { z } from 'zod';

import { PUBLIC_ID_LENGTH } from '@ffp/database/constants';

export { PUBLIC_ID_LENGTH };

/**
 * The URL-facing identifier on every routable table. Length comes from the same
 * constant the column and the generator use.
 *
 * Routes are keyed on this rather than the UUID primary key — see
 * `.claude/rules/identifiers.md` for which endpoints resolve by which.
 */
export const publicIdSchema = z.string().length(PUBLIC_ID_LENGTH);
