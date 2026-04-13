import { Icon, Icons } from '@web/components/Icon';

export interface SessionCountPillProps {
  /** Number of sessions to display */
  count: number;
}

/**
 * Small pill showing session count for upcoming (gated) phases.
 */
export const SessionCountPill: React.FC<SessionCountPillProps> = ({ count }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-ffp-dark-blue px-2 py-1 text-xs font-medium text-white">
    <Icon name={Icons.REPEAT} styleProps={{ size: 'xs', colour: '#ffffff' }} />
    {String(count)} sessions
  </span>
);
