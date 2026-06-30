import {
  AUDIENCE_LABELS,
  DIFFICULTY_LABELS,
  focusLabel,
  type Exercise,
} from './prototype-programmes';
import { TagChip } from './TagChip';

interface ExerciseTagsProps {
  exercise: Exercise;
}

/**
 * The typed tags carried by an exercise — difficulty, body areas and audience hints,
 * each chip coloured by its tag category. The movement category is shown by the slot
 * it fills, so it is not repeated here.
 */
export const ExerciseTags: React.FC<ExerciseTagsProps> = ({ exercise }) => (
  <div className="flex flex-wrap gap-1">
    <TagChip label={DIFFICULTY_LABELS[exercise.difficulty]} tone="info" />
    {exercise.areas.map((area) => (
      <TagChip key={area} label={focusLabel(area)} tone="muted" />
    ))}
    {exercise.audience.map((tag) => (
      <TagChip key={tag} label={AUDIENCE_LABELS[tag]} tone="success" />
    ))}
  </div>
);
