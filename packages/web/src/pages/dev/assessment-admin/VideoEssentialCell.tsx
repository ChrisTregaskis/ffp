import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { iconVar } from './prototype-labels';
import { TagChip } from './TagChip';

/** New column for the programme model — flags a core, must-have exercise. */
export const VideoEssentialCell: React.FC<{ essential: boolean }> = ({ essential }) =>
  essential ? (
    <span className="flex items-center gap-1">
      <Icon name={Icons.SHIELD} styleProps={{ size: 'xs', colour: iconVar('warning') }} />
      <TagChip label="Essential" tone="warning" />
    </span>
  ) : (
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>—</Text>
  );
