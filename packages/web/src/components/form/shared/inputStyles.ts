/**
 * Shared input styling utility for standard form components.
 *
 * @param variant - 'input' for elements that receive focus directly (input, textarea, select),
 *                  'container' for wrapper divs that use focus-within (e.g. FormTagInput)
 */
export const getInputClassName = (
  error: boolean,
  variant: 'input' | 'container' = 'input',
  compact = false
): string => {
  const focusRing =
    variant === 'input'
      ? 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
      : 'focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent';

  const border = error ? 'border-destructive' : 'border-border';
  const minHeight = compact ? '' : 'min-h-[42px]';

  return `${minHeight} border rounded-md bg-white shadow-sm hover:border-primary ${focusRing} ${border}`;
};
