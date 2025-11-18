/**
 * Motion animation wrapper components.
 *
 * Reusable animation primitives built on the motion library.
 * These components provide consistent, performant animations throughout the application.
 *
 * Available animations:
 * - FadeSlideIn: Fade and slide up effect (with optional delay for staggering)
 * - SpringScale: Spring-based scale animation with bounce
 * - ClickScale: Subtle click/tap feedback for interactive elements
 * - CardTransition: Horizontal slide transitions for card-based multi-step flows
 *
 */

export { FadeSlideIn } from './FadeSlideIn';
export { SpringScale } from './SpringScale';
export { ClickScale } from './ClickScale';
export { CardTransition } from './CardTransition';

export type { FadeSlideInProps } from './FadeSlideIn';
export type { SpringScaleProps } from './SpringScale';
export type { ClickScaleProps } from './ClickScale';
export type { CardTransitionProps } from './CardTransition';
