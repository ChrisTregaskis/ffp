import { Text } from '@web/components/text';

interface StatusPillProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Active / draft (or active / inactive) status pill. */
export const StatusPill: React.FC<StatusPillProps> = ({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Draft',
}) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 ${active ? 'bg-success/10' : 'bg-muted'}`}
  >
    <Text
      styleProps={{
        size: 'xs',
        weight: 'medium',
        colour: active ? 'success' : 'muted-foreground',
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </Text>
  </span>
);
