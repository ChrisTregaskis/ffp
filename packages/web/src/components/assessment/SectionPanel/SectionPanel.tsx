export type SectionPanelVariant = 'card' | 'tinted' | 'gradient';

export interface SectionPanelProps {
  /** Panel content */
  children: React.ReactNode;
  /** Visual variant @default 'card' */
  variant?: SectionPanelVariant;
  /** HTML element to render @default 'section' */
  as?: 'section' | 'div';
  /** Additional CSS classes */
  className?: string;
}

const VARIANT_MAP: Record<SectionPanelVariant, string> = {
  card: 'border border-border bg-card',
  tinted: 'bg-secondary/30',
  gradient: 'bg-linear-to-br from-secondary/40 to-primary/10',
};

/**
 * Styled section container for assessment screens.
 *
 * Provides the shared `rounded-2xl shadow-xl` treatment used across
 * assessment screens and cards, with three visual variants:
 * - `card` (default): white background with border
 * - `tinted`: light purple/lavender background
 * - `gradient`: secondary-to-primary gradient background
 */
export const SectionPanel: React.FC<SectionPanelProps> = ({
  children,
  variant = 'card',
  as: Element = 'section',
  className = '',
}) => {
  return (
    <Element
      className={`overflow-hidden rounded-2xl shadow-xl ${VARIANT_MAP[variant]} ${className}`.trim()}
    >
      {children}
    </Element>
  );
};
