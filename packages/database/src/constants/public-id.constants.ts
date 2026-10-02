/**
 * Length of a `public_id`, the URL-facing identifier on every routable table.
 *
 * Standard nanoid URL-safe alphabet (A-Za-z0-9_-); 12 characters gives ~71 bits
 * of entropy, a negligible collision probability at our scale. The column
 * definition, the generator and the Zod schemas all read it from here, so the
 * three cannot drift.
 */
export const PUBLIC_ID_LENGTH = 12;
