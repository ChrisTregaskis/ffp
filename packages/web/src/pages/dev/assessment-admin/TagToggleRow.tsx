import { Text } from '@web/components/text';

export interface TagToggleOption {
  value: string;
  label: string;
}

interface TagToggleRowProps {
  label: string;
  options: TagToggleOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** A labelled group of toggleable tag chips — click to add or remove a tag in a category. */
export const TagToggleRow: React.FC<TagToggleRowProps> = ({
  label,
  options,
  selected,
  onToggle,
}) => (
  <div className="space-y-1.5">
    <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>{label}</Text>
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onToggle(option.value);
            }}
            className={`rounded-full border px-3 py-1 ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <Text styleProps={{ size: 'sm', colour: isSelected ? 'primary' : 'foreground' }}>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  </div>
);
