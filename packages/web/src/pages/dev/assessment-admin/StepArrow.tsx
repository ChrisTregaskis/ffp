import { Icon, Icons } from '@web/components/Icon';

import { iconVar } from './prototype-labels';

/** Down-arrow connector between scoring example steps. */
export const StepArrow: React.FC = () => (
  <div className="flex justify-start pl-2.5">
    <Icon name={Icons.ARROWDOWN} styleProps={{ size: 'sm', colour: iconVar('muted-foreground') }} />
  </div>
);
