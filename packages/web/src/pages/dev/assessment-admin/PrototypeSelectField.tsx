import { Select } from '@web/components/select';

import { PrototypeField } from './PrototypeField';

export interface SelectOption {
  value: string;
  label: string;
}

interface PrototypeSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  placeholder?: string;
}

/** Labelled select field for the prototype — uses the app `Select` for consistency. */
export const PrototypeSelectField: React.FC<PrototypeSelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  hint,
  placeholder,
}) => (
  <PrototypeField label={label} hint={hint}>
    <Select
      value={value}
      onChange={(next) => {
        onChange(String(next));
      }}
      options={options}
      ariaLabel={label}
      placeholder={placeholder}
    />
  </PrototypeField>
);
