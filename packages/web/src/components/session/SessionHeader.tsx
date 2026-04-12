import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';

export interface SessionHeaderProps {
  /** Session name displayed in the centre */
  sessionName: string;
  /** Current exercise index (0-based) */
  activeExerciseIndex: number;
  /** Total number of exercises */
  totalExercises: number;
  /** Whether the sidebar is currently open */
  sidebarOpen: boolean;
  /** Called when the exit button is clicked */
  onExit: () => void;
  /** Called when the sidebar toggle is clicked */
  onToggleSidebar: () => void;
}

/**
 * Top bar for the session workout page.
 *
 * Left: exit button. Centre: session title + exercise counter.
 * Right: sidebar toggle (desktop only).
 */
export const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionName,
  activeExerciseIndex,
  totalExercises,
  sidebarOpen,
  onExit,
  onToggleSidebar,
}) => (
  <header className="flex items-center justify-between border-b border-border px-4 py-3">
    {/* Left: Exit */}
    <Button variant="ghost" size="sm" onClick={onExit}>
      <Icon name={Icons.CLOSE} styleProps={{ size: 'sm', colour: 'currentColor' }} />
      <Text
        as="span"
        styleProps={{ size: 'sm', weight: 'medium' }}
        className="ml-2 hidden sm:inline"
      >
        Exit Session
      </Text>
    </Button>

    {/* Centre: Session title + exercise count */}
    <div className="text-center">
      <Text as="span" styleProps={{ size: 'sm', weight: 'semibold' }}>
        {sessionName}
      </Text>
      <Text as="span" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="ml-2">
        Exercise {String(activeExerciseIndex + 1)} of {String(totalExercises)}
      </Text>
    </div>

    {/* Right: Sidebar toggle (desktop only) */}
    <div className="hidden lg:block">
      <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
        <Icon
          name={sidebarOpen ? Icons.LEFTPANELCLOSE : Icons.LEFTPANELOPEN}
          styleProps={{ size: 'sm', colour: 'currentColor' }}
        />
      </Button>
    </div>
    <div className="lg:hidden">
      <div className="w-10" />
    </div>
  </header>
);
