import { Switch } from '@web/components/atoms/Switch';
import { Text } from '@web/components/text';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

/** Labelled on/off switch for the prototype's local state. */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, hint }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <Text styleProps={{ size: 'sm', weight: 'medium' }}>{label}</Text>
      {hint && (
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {hint}
        </Text>
      )}
    </div>
    <Switch checked={checked} onChange={onChange} ariaLabel={label} />
  </div>
);
