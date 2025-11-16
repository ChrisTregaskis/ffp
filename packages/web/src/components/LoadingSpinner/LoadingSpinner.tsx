/**
 * Available spinner sizes.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Available spinner variants.
 */
export type SpinnerVariant = 'inline' | 'center';

export interface LoadingSpinnerProps {
  /** Spinner size @default 'md' */
  size?: SpinnerSize;
  /** Spinner variant @default 'inline' */
  variant?: SpinnerVariant;
  /** Spinner colour (CSS color value) @default 'rgba(109, 159, 255, 0.6)' */
  colour?: string;
  /** Additional custom classes */
  className?: string;
}

/**
 * Map sizes to pixel dimensions.
 */
const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-[3px]',
  lg: 'w-8 h-8 border-4',
};

/**
 * LoadingSpinner component for loading states.
 *
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - Inline or centered variants
 * - CSS-based animation (no JS)
 * - Uses FFP theme colours
 * - Accessible (includes aria-label)
 *
 * @example
 * ```tsx
 * // Inline spinner (e.g., in a button)
 * <LoadingSpinner size="sm" variant="inline" />
 * ```
 *
 * @example
 * ```tsx
 * // Centered spinner (e.g., loading page)
 * <LoadingSpinner size="lg" variant="center" />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'inline',
  colour = 'rgba(109, 159, 255, 0.6)',
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  const sizeClass = SIZE_MAP[size];
  const containerClass =
    variant === 'center' ? 'flex items-center justify-center w-full h-full' : '';

  return (
    <div className={`${containerClass} ${className}`.trim()} role="status" aria-label="Loading">
      <div
        className={`${sizeClass} spinner`}
        style={{ '--spinner-colour': colour } as React.CSSProperties}
      />
    </div>
  );
}
