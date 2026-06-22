import { Icon, Icons } from '@web/components/Icon';
import { Text, Title } from '@web/components/text';

import { iconVar } from './prototype-labels';

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional back action — renders a "← back" link above the title */
  backLabel?: string;
  onBack?: () => void;
  /** Right-aligned actions (buttons) */
  actions?: React.ReactNode;
}

/** Consistent page-style header for a prototype view. */
export const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  subtitle,
  backLabel,
  onBack,
  actions,
}) => (
  <div className="mb-6">
    {onBack && backLabel && (
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Icon
          name={Icons.CHEVRONLEFT}
          styleProps={{ size: 'sm', colour: iconVar('muted-foreground') }}
        />
        <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{backLabel}</Text>
      </button>
    )}
    <div className="flex items-start justify-between gap-4">
      <div>
        <Title as="h2">{title}</Title>
        {subtitle && (
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {subtitle}
          </Text>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  </div>
);
