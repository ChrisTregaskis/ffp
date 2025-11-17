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
 *
 * @example
 * ```tsx
 * import { FadeSlideIn, ClickScale } from '@web/components/motion';
 *
 * // Fade in on mount
 * <FadeSlideIn>
 *   <Card>Content</Card>
 * </FadeSlideIn>
 *
 * // Click feedback
 * <ClickScale>
 *   <Button>Click Me</Button>
 * </ClickScale>
 * ```
 */

export { FadeSlideIn } from './FadeSlideIn';
export { SpringScale } from './SpringScale';
export { ClickScale } from './ClickScale';

export type { FadeSlideInProps } from './FadeSlideIn';
export type { SpringScaleProps } from './SpringScale';
export type { ClickScaleProps } from './ClickScale';
