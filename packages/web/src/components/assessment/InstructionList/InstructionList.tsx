import { Icon } from '@web/components/Icon';
import type { IconColour, IconName } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface InstructionListProps {
  /** List items to render */
  items: string[];
  /** Optional title above the list */
  title?: string;
  /** Heading level for the title @default 'p' */
  titleAs?: 'p' | 'h2' | 'h3';
  /** Bullet style @default 'dot' */
  bulletStyle?: 'dot' | 'icon';
  /** Icon name (required when bulletStyle='icon') */
  bulletIcon?: IconName;
  /** Icon colour (icon style only) @default 'var(--color-success)' */
  bulletColour?: IconColour;
  /** Additional wrapper classes */
  className?: string;
}

/**
 * Bulleted instruction list with optional title.
 *
 * Supports two bullet styles: a small dot (default) or an icon.
 * The outer container styling (gradient background, padding, shadow) is
 * owned by the consuming component — this focuses on the list content.
 */
export const InstructionList: React.FC<InstructionListProps> = ({
  items,
  title,
  titleAs = 'p',
  bulletStyle = 'dot',
  bulletIcon,
  bulletColour = 'var(--color-success)' as const,
  className = '',
}) => {
  // Derive title text style from element type
  const titleStyleProps =
    titleAs === 'p'
      ? ({ size: 'sm', weight: 'semibold', colour: 'foreground' } as const)
      : ({ size: 'xl', weight: 'semibold', colour: 'ffp-navy' } as const);

  return (
    <div className={className}>
      {title && (
        <Text as={titleAs} styleProps={titleStyleProps} className="mb-3">
          {title}
        </Text>
      )}
      <ul className={bulletStyle === 'dot' ? 'space-y-2' : 'space-y-3'}>
        {items.map((item) => (
          <li
            key={item}
            className={`flex items-start ${bulletStyle === 'dot' ? 'gap-2.5' : 'gap-3'}`}
          >
            {bulletStyle === 'icon' && bulletIcon ? (
              <Icon name={bulletIcon} styleProps={{ size: 'md', colour: bulletColour }} />
            ) : (
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            )}
            <Text as="span" styleProps={{ size: 'sm' }}>
              {item}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
};
