import { CONTROL_CLASS } from './prototype-styles';
import { PrototypeField } from './PrototypeField';

interface PrototypeTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'number';
  textarea?: boolean;
}

/** Controlled text / number / textarea field for the prototype forms. */
export const PrototypeTextField: React.FC<PrototypeTextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  textarea = false,
}) => (
  <PrototypeField label={label} hint={hint}>
    {textarea ? (
      <textarea
        className={CONTROL_CLASS}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    ) : (
      <input
        className={CONTROL_CLASS}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    )}
  </PrototypeField>
);
