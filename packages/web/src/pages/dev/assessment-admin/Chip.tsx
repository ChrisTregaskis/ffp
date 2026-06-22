import { Text } from '@web/components/text';

/** Small inline chip used to highlight a term (e.g. a dimension name) in explanatory copy. */
export const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded bg-muted px-1.5 py-0.5">
    <Text styleProps={{ size: 'xs', weight: 'medium' }}>{children}</Text>
  </span>
);
