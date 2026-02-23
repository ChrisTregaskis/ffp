import { Icon, IconBadge } from '@web/components/Icon';
import type { IconBadgeVariant, IconColour, IconName } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface SectionHeaderProps {
  /** Icon name */
  icon: IconName;
  /** Section title text */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Heading level @default 'h3' */
  as?: 'h2' | 'h3';
  /** Horizontal alignment @default 'left' */
  align?: 'left' | 'centre';
  /** Icon rendering style @default 'plain' */
  iconStyle?: 'plain' | 'badge';
  /** Icon colour (plain style only) @default 'var(--color-primary)' */
  iconColour?: IconColour;
  /** IconBadge variant (badge style only) @default 'secondary' */
  badgeVariant?: IconBadgeVariant;
  /** Additional wrapper classes */
  className?: string;
}

/**
 * Section header with icon, title, and optional description.
 *
 * Supports two icon styles: a plain inline icon or a badge-wrapped icon.
 * Used across assessment cards and screens for consistent section headings.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  as = 'h3',
  align = 'left',
  iconStyle = 'plain',
  iconColour = 'var(--color-primary)' as const,
  badgeVariant = 'secondary',
  className = '',
}) => {
  const alignClasses = align === 'centre' ? 'justify-center' : '';
  const descriptionAlign = align === 'centre' ? 'text-center' : '';

  return (
    <div className={className}>
      <div
        className={`flex items-center ${iconStyle === 'badge' ? 'gap-3' : 'gap-2'} ${alignClasses}`}
      >
        {iconStyle === 'badge' ? (
          <IconBadge name={icon} size="md" variant={badgeVariant} />
        ) : (
          <Icon name={icon} styleProps={{ size: 'md', colour: iconColour }} />
        )}
        <Text as={as} styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
          {title}
        </Text>
      </div>

      {description && (
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground' }}
          className={`mt-1 ${descriptionAlign}`}
        >
          {description}
        </Text>
      )}
    </div>
  );
};
