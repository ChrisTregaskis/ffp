import type { ProgrammeDetailResponse } from '@ffp/core';

import { PageHeader } from '@web/components/layout/PageHeader';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { ProgressBar } from '@web/components/ProgressBar/ProgressBar';
import { Text } from '@web/components/text/Text';

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

        <div className="mb-2 flex items-center justify-between">
          <Text
            styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
            className="uppercase tracking-wide"
          >
            Overall Progress
          </Text>
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>
            {String(completedPhases)} of {String(totalPhases)} phases
          </Text>
        </div>
        <ProgressBar percent={progressPercent} trackClassName="bg-white" />
      </div>
    </FadeSlideIn>
  );
};
