/** A count with its noun, e.g. `pluralise(2, 'flow', 'flows')` gives "2 flows". */
export const pluralise = (count: number, singular: string, plural: string): string =>
  `${String(count)} ${count === 1 ? singular : plural}`;

/** Convert a display name to a URL-safe slug (kebab-case) */
export const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
