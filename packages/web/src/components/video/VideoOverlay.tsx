import { Icon, Icons, PressableArea, Text } from '@web/components/atoms';

export interface VideoOverlayProps {
  /** Whether the video has finished playing */
  hasEnded?: boolean;
  /** Called when the overlay is clicked */
  onClick: () => void;
  /** Shown under the play icon and used as the accessible name, when the click does more than play */
  label?: string;
}

/**
 * Play/Replay overlay for a video frame.
 *
 * Shows a play icon on hover before/during playback,
 * and a replay icon persistently after the video ends.
 */
export const VideoOverlay: React.FC<VideoOverlayProps> = ({ hasEnded = false, onClick, label }) => (
  <PressableArea
    aria-label={label ?? (hasEnded ? 'Replay video' : 'Play video')}
    onClick={onClick}
    className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity focus-visible:ring-inset ${
      hasEnded
        ? 'bg-black/20'
        : 'bg-transparent opacity-0 hover:bg-black/20 hover:opacity-100 focus-visible:bg-black/20 focus-visible:opacity-100'
    }`}
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
      <Icon
        name={hasEnded ? Icons.RELOAD : Icons.PLAY}
        styleProps={{ size: 'lg', colour: 'var(--color-ffp-dark-blue)' }}
      />
    </div>
    {label && (
      <Text
        styleProps={{ size: 'sm', weight: 'medium', colour: 'white' }}
        className="rounded-full bg-black/60 px-3 py-1"
      >
        {label}
      </Text>
    )}
  </PressableArea>
);
