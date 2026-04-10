import { BulletList } from './BulletList';
import { LabelledSection } from './LabelledSection';

export interface ExerciseInstruction {
  setup: string;
  execution: string;
  tips: string[];
}

export interface ExerciseDetailProps {
  /** Exercise instructions with setup, execution, and tips */
  instructions: ExerciseInstruction;
}

/**
 * Always-visible exercise instructions panel.
 *
 * Displays Setup, Execution, and Tips sections in a muted container.
 */
export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ instructions }) => (
  <div className="space-y-3 rounded-lg bg-muted/30 px-4 py-4">
    <LabelledSection label="Setup">{instructions.setup}</LabelledSection>

    <LabelledSection label="Execution">{instructions.execution}</LabelledSection>

    {instructions.tips.length > 0 && (
      <LabelledSection label="Tips">
        <BulletList items={instructions.tips} />
      </LabelledSection>
    )}
  </div>
);
