/**
 * Available logo variants.
 * Each variant corresponds to a specific logo file in the assets directory.
 */
export type LogoVariant = 'brand-blue' | 'primary-dark' | 'secondary-light' | 'icon' | 'white';

/**
 * Available logo sizes.
 */
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Map variants to logo file paths.
 */
const VARIANT_FILE_MAP: Record<LogoVariant, string> = {
  'brand-blue': '/src/assets/ffp-logo-brand-blue.svg',
  'primary-dark': '/src/assets/ffp-logo-primary-dark.svg',
  'secondary-light': '/src/assets/ffp-logo-secondary-light.svg',
  icon: '/src/assets/ffp-logo-icon-small.svg',
  white: '/src/assets/ffp-logo-white.svg',
};

/**
 * Map sizes to pixel dimensions for variants without background.
 * Maintains 66:58 aspect ratio (approx 1.14:1).
 */
const SIZE_DIMENSIONS_NO_BG: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 33, height: 29 }, // 50% of original
  sm: { width: 53, height: 46 }, // 80% of original
  md: { width: 66, height: 58 }, // Original size
  lg: { width: 99, height: 87 }, // 150% of original
  xl: { width: 132, height: 116 }, // 200% of original
};

/**
 * Map sizes to pixel dimensions for variants with background (primary-dark, icon).
 * Maintains 82:74 aspect ratio (approx 1.11:1) with 8px padding around logo.
 */
const SIZE_DIMENSIONS_WITH_BG: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 41, height: 37 }, // 50% of original
  sm: { width: 66, height: 59 }, // 80% of original
  md: { width: 82, height: 74 }, // Original size
  lg: { width: 123, height: 111 }, // 150% of original
  xl: { width: 164, height: 148 }, // 200% of original
};

export interface LogoProps {
  /** Visual style variant @default 'brand-blue' */
  variant?: LogoVariant;
  /** Logo size @default 'md' */
  size?: LogoSize;
  /** Alternative text for accessibility @default 'Fit For Purpose logo' */
  alt?: string;
  /** Additional custom classes */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Logo component for displaying the Fit For Purpose brand logo.
 *
 * Supports multiple variants (brand colours and backgrounds) and sizes.
 * Automatically maintains correct aspect ratio.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'brand-blue',
  size = 'md',
  alt = 'Fit For Purpose logo',
  className = '',
  onClick,
}) => {
  const src = VARIANT_FILE_MAP[variant];

  // Use different dimensions for variants with background
  const hasBackground = variant === 'primary-dark' || variant === 'icon';
  const dimensionsMap = hasBackground ? SIZE_DIMENSIONS_WITH_BG : SIZE_DIMENSIONS_NO_BG;
  const { width, height } = dimensionsMap[size];

  // Base styles
  const baseStyles = 'inline-block';

  // Add cursor pointer if clickable
  const cursorClass = onClick ? 'cursor-pointer' : '';

  // Combine classes
  const classes = `${baseStyles} ${cursorClass} ${className}`.trim();

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={classes}
      onClick={onClick}
      aria-label={alt}
    />
  );
};
