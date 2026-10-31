/**
 * Control styling without a width OR a border/focus colour — compose a border
 * variant onto it (e.g. the default border, or a warning border when out of sync).
 */
export const CONTROL_CLASS_BASE =
  'rounded-md bg-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-1';

/** Control styling without a width (for inline / fixed-width inputs). */
export const CONTROL_CLASS_AUTO = `${CONTROL_CLASS_BASE} border border-border focus:border-primary focus:ring-primary`;

/** Shared full-width control styling for the prototype's controlled inputs. */
export const CONTROL_CLASS = `w-full ${CONTROL_CLASS_AUTO}`;
