import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

interface InfoNoteProps {
  children: React.ReactNode;
  /** When provided, renders a dismiss button (mirrors StaticAlert's onDismiss) */
  onDismiss?: () => void;
}

/**
 * Solid informational note — blue background, white text. Mirrors StaticAlert's
 * solid appearance for an 'info' variant the shipped component doesn't yet have.
 */
export const InfoNote: React.FC<InfoNoteProps> = ({ children, onDismiss }) => (
  <div className="flex items-start gap-2 rounded-md border border-info bg-info p-3">
    <Icon name={Icons.HELPCIRCLE} styleProps={{ size: 'sm', colour: '#ffffff' }} />
    <Text as="p" styleProps={{ size: 'sm', colour: 'white' }} className="flex-1">
      {children}
    </Text>
    {onDismiss && (
      <button
        type="button"
        aria-label="Dismiss note"
        onClick={onDismiss}
        className="shrink-0 opacity-80 hover:opacity-100"
      >
        <Icon name={Icons.CLOSE} styleProps={{ size: 'sm', colour: '#ffffff' }} />
      </button>
    )}
  </div>
);
