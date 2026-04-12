import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

export interface VideoOverlayProps {
  /** Whether the video has finished playing */
  hasEnded: boolean;
  /** Called when the overlay is clicked */
  onClick: () => void;
}

/**
 * Play/Replay overlay for the video player.
 *
 * Shows a play icon on hover before/during playback,
 * and a replay icon persistently after the video ends.
 */
export const VideoOverlay: React.FC<VideoOverlayProps> = ({ hasEnded, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={hasEnded ? 'Replay video' : 'Play video'}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
    className={`absolute inset-0 flex cursor-pointer items-center justify-center transition-opacity ${
      hasEnded ? 'bg-black/20' : 'bg-transparent opacity-0 hover:bg-black/20 hover:opacity-100'
    }`}
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
      <Icon
        name={hasEnded ? Icons.RELOAD : Icons.PLAY}
        styleProps={{ size: 'lg', colour: 'var(--color-ffp-dark-blue)' }}
      />
    </div>
  </div>
);
