import type { ProgrammeDetailResponse } from '@ffp/core';

import { PageHeader } from '@web/components/molecules';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';

import { ProgressSummary } from './ProgressSummary';

type Programme = ProgrammeDetailResponse['programme'];

export interface ProgrammeHeaderProps extends Pick<Programme, 'name' | 'description'> {
  /** Number of completed phases */
  completedPhases: number;
  /** Total number of phases */
  totalPhases: number;
}

/**
 * Programme header with name, description, metadata badges,
 * and an overall progress bar (gradient from primary-blue to dark-blue).
 */
export const ProgrammeHeader: React.FC<ProgrammeHeaderProps> = ({
  name,
  description,
  completedPhases,
  totalPhases,
}) => {
  const progressPercent = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  return (
    <FadeSlideIn delay={0.1}>
      <div className="mb-8">
        <PageHeader title={name} subtitle={description ?? undefined} />

        <ProgressSummary
          label="Overall Progress"
          count={`${String(completedPhases)} of ${String(totalPhases)} phases`}
          percent={progressPercent}
          trackClassName="bg-white"
        />
      </div>
    </FadeSlideIn>
  );
};
