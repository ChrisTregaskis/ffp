import { Text } from '@web/components/text/Text';

export interface BulletListProps {
  /** List items to display */
  items: string[];
}

/**
 * Bulleted list with small primary-blue dot indicators.
 */
export const BulletList: React.FC<BulletListProps> = ({ items }) => (
  <ul className="space-y-1">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ffp-primary-blue" />
        <Text as="span" styleProps={{ size: 'sm' }}>
          {item}
        </Text>
      </li>
    ))}
  </ul>
);
