import { Icon } from '@web/components/Icon/Icon';
import { Text } from '@web/components/text/Text';

export interface PasswordRequirementProps {
  /** Description of the requirement */
  description: string;
  /** Whether the requirement is met */
  isMet: boolean;
}

/**
 * Password requirement item component.
 *
 * Displays a single password requirement with a success or error icon.
 */
export const PasswordRequirement: React.FC<PasswordRequirementProps> = ({ description, isMet }) => {
  return (
    <div className="flex items-center gap-2">
      <Icon
        name={isMet ? 'CheckCircle' : 'AlertCircle'}
        styleProps={{
          size: 'sm',
          className: isMet ? 'text-success' : 'text-destructive',
        }}
      />
      <Text
        styleProps={{ size: 'sm' }}
        className={isMet ? 'text-success' : 'text-muted-foreground'}
      >
        {description}
      </Text>
    </div>
  );
};
