import { Checkbox, Label, Radio } from '@web/components/atoms';

export interface ChoiceOptionProps {
  /** `radio` for single choice, `checkbox` for multi choice */
  type: 'radio' | 'checkbox';
  id: string;
  /** Shared by every option of the question */
  name: string;
  value: string;
  label: string;
  isSelected: boolean;
  hasError: boolean;
  /** Also set on an unselected option once a multi-choice cap is reached */
  disabled: boolean;
  onSelect: () => void;
}

/** One answer option of a choice question: the control and its text in a selectable card. */
export const ChoiceOption: React.FC<ChoiceOptionProps> = ({
  type,
  id,
  name,
  value,
  label,
  isSelected,
  hasError,
  disabled,
  onSelect,
}) => {
  const Control = type === 'radio' ? Radio : Checkbox;

  return (
    <Label
      variant="choice"
      htmlFor={id}
      className={`
        flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${
          isSelected
            ? 'border-primary bg-secondary/30 shadow-md'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }
        ${hasError && !isSelected ? 'border-destructive/50' : ''}
        ${disabled ? 'cursor-not-allowed opacity-60' : ''}
      `}
      control={
        <Control
          variant="choice"
          id={id}
          name={name}
          value={value}
          checked={isSelected}
          onChange={onSelect}
          disabled={disabled}
          aria-invalid={hasError}
        />
      }
    >
      {label}
    </Label>
  );
};
