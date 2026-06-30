import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { GOALS, type GoalId } from './prototype-programmes';
import {
  VIDEO_MOVEMENT_LABELS,
  type PrototypeVideo,
  type VideoDifficulty,
  type VideoMovementType,
  type VideoStatus,
} from './prototype-videos';
import { SlideOver } from './SlideOver';
import { TagChip } from './TagChip';
import { TagToggleRow } from './TagToggleRow';
import { ToggleSwitch } from './ToggleSwitch';

interface VideoEditPanelProps {
  video: PrototypeVideo | null;
  onClose: () => void;
  onChange: (next: PrototypeVideo) => void;
}

const MOVEMENT_OPTIONS = (Object.keys(VIDEO_MOVEMENT_LABELS) as VideoMovementType[]).map(
  (value) => ({ value, label: VIDEO_MOVEMENT_LABELS[value] })
);

const STATUS_OPTIONS: { value: VideoStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const DIFFICULTY_OPTIONS: { value: VideoDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const GOAL_OPTIONS = GOALS.map((goal) => ({ value: goal.id, label: goal.label }));

const toggleInArray = <T extends string>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

const ReadOnlyTags: React.FC<{ label: string; values: string[] }> = ({ label, values }) => (
  <div className="space-y-1.5">
    <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>{label}</Text>
    {values.length === 0 ? (
      <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>—</Text>
    ) : (
      <div className="flex flex-wrap gap-1">
        {values.map((value) => (
          <TagChip key={value} label={value} tone="muted" />
        ))}
      </div>
    )}
  </div>
);

/** Mirrors the live video metadata form, with the programme-model fields grouped and marked. */
export const VideoEditPanel: React.FC<VideoEditPanelProps> = ({ video, onClose, onChange }) => (
  <SlideOver isOpen={video !== null} onClose={onClose} title="Edit video" subtitle={video?.title}>
    {video && (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Video title
          </Text>
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>{video.title}</Text>
        </div>

        <div className="space-y-1.5">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Movement type
          </Text>
          <Select
            value={video.movementType}
            ariaLabel="Movement type"
            options={MOVEMENT_OPTIONS}
            onChange={(value) => {
              onChange({ ...video, movementType: value as VideoMovementType });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Status
          </Text>
          <Select
            value={video.status}
            ariaLabel="Status"
            options={STATUS_OPTIONS}
            onChange={(value) => {
              onChange({ ...video, status: value as VideoStatus });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Difficulty
          </Text>
          <Select
            value={video.difficulty}
            ariaLabel="Difficulty"
            options={DIFFICULTY_OPTIONS}
            onChange={(value) => {
              onChange({ ...video, difficulty: value as VideoDifficulty });
            }}
          />
        </div>

        <ReadOnlyTags label="Body parts" values={video.bodyParts} />
        <ReadOnlyTags label="Equipment" values={video.equipment} />
        <ReadOnlyTags label="Tags" values={video.tags} />

        {/* Programme-model additions — the iteration on the existing form */}
        <div className="space-y-5 rounded-lg border border-info/30 bg-info/5 p-3">
          <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'info' }}>
            Programme-model additions
          </Text>

          <TagToggleRow
            label="Goal (new)"
            options={GOAL_OPTIONS}
            selected={video.goals}
            onToggle={(value) => {
              onChange({ ...video, goals: toggleInArray(video.goals, value as GoalId) });
            }}
          />

          <ToggleSwitch
            checked={video.essential}
            onChange={(checked) => {
              onChange({ ...video, essential: checked });
            }}
            label="Essential (new)"
            hint="Favoured for the persistent thread in a member's programme."
          />
        </div>

        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          Mock — changes stay in this prototype and reset on refresh. Body parts, equipment and tags
          are free-text fields in the full form.
        </Text>
      </div>
    )}
  </SlideOver>
);
