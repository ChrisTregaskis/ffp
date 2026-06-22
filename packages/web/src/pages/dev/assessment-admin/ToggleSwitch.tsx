import { Text } from '@web/components/text';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

/** Lightweight on/off switch (no themed equivalent exists in the library yet). */
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked
          ? 'bg-gradient-to-r from-ffp-primary-blue to-ffp-dark-blue'
          : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);
