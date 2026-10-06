/** A stored number as a form field holds it; absent becomes an empty field. */
export const numberToField = (value: number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value);

/**
 * A form field's number, or `undefined` when the field is blank or not a number.
 * Decimals are kept: a whole-number field enforces that in its validation, not here.
 */
export const fieldToNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isNaN(parsed) ? undefined : parsed;
};
