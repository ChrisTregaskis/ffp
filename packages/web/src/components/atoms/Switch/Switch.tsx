import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  onBlur?: () => void;
  disabled?: boolean;
  /** Needed when no `<label htmlFor>` names the switch */
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/** On/off control. The primitive behind every toggle; compose it rather than restyling a button. */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  id,
  onBlur,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    disabled={disabled}
    onClick={() => {
      onChange(!checked);
    }}
    onBlur={onBlur}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      checked ? 'bg-primary' : 'bg-muted-foreground/30'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);
