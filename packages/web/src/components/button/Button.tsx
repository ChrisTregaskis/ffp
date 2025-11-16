import type { ReactNode, MouseEvent } from 'react';

/**
 * Available button variants.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'neutral'
  | 'link';

/**
 * Available button sizes.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Map variants to Tailwind class names.
 * Uses FFP theme colours defined in index.css.
 */
const VARIANT_CLASS_MAP: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 shadow-sm',
  success: 'bg-success text-white hover:bg-success/90 active:bg-success/80 shadow-sm',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-sm',
  neutral: 'bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70 shadow-sm',
  link: 'text-primary underline-offset-4 hover:underline active:text-primary/80',
};

/**
 * Map sizes to Tailwind class names.
 */
const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

export interface ButtonProps {
  /** Button content */
  children: ReactNode;
  /** Visual style variant @default 'primary' */
  variant?: ButtonVariant;
  /** Button size @default 'md' */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner, disables interaction) */
  loading?: boolean;
  /** Icon to display */
  icon?: ReactNode;
  /** Icon position relative to text @default 'left' */
  iconPosition?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
  /** Click handler */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Button type @default 'button' */
  type?: 'button' | 'submit' | 'reset';
  /** Additional custom classes */
  className?: string;
}

/**
 * Loading spinner component.
 * Simple CSS-based spinner for loading states.
 */
function LoadingSpinner({ size = 'md' }: { size?: ButtonSize }): JSX.Element {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <svg
      className={`${sizeClass} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Button component for user interactions.
 *
 * Supports multiple variants, sizes, loading states, and icons.
 * Uses FFP theme colours defined in index.css.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button variant="destructive" loading icon={<TrashIcon />}>
 *   Delete
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button variant="link" size="sm">
 *   Learn More
 * </Button>
 * ```
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps): JSX.Element {
  const variantClass = VARIANT_CLASS_MAP[variant];
  const sizeClass = SIZE_CLASS_MAP[size];

  // Base styles that apply to all buttons
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed ';

  // Width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Combine all classes
  const classes = `${baseStyles} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  // Determine if button should be disabled
  const isDisabled = disabled || loading;

  // Render icon or loading spinner on left
  const leftContent =
    iconPosition === 'left' ? (
      <>
        {loading && <LoadingSpinner size={size} />}
        {!loading && icon}
      </>
    ) : null;

  // Render icon or loading spinner on right
  const rightContent =
    iconPosition === 'right' ? (
      <>
        {loading && <LoadingSpinner size={size} />}
        {!loading && icon}
      </>
    ) : null;

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      onClick={onClick}
      aria-disabled={isDisabled}
      aria-busy={loading}
    >
      {leftContent}
      {children}
      {rightContent}
    </button>
  );
}
