/** A count with its noun, e.g. `pluralise(2, 'flow', 'flows')` gives "2 flows". */
export const pluralise = (count: number, singular: string, plural: string): string =>
  `${String(count)} ${count === 1 ? singular : plural}`;

/**
 * Convert a display name to a URL-safe slug (kebab-case). With `maxLength` the
 * slug is cut to fit, dropping a hyphen the cut would leave at the end.
 */
export const toSlug = (value: string, maxLength?: number): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return maxLength === undefined ? slug : slug.slice(0, maxLength).replace(/-$/, '');
};
