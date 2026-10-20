/**
 * Map a theme colour token to the CSS variable the Icon component expects
 * (Icon `colour` takes CSS values, not the Text theme-token union).
 */
export const iconVar = (token: string): `var(${string})` => `var(--color-${token})`;
