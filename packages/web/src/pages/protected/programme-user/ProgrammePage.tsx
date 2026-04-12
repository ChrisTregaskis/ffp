import { PageContainer } from '@web/components/layout/PageContainer';
import { PageLoadingState } from '@web/components/layout/PageLoadingState';
import { EmptyProgrammeState } from '@web/components/programme/EmptyProgrammeState';
import { ProgrammeHeader } from '@web/components/programme/ProgrammeHeader';
import { useProgrammeDetailQuery } from '@web/hooks/programmes';

/**
 * Programme overview page with vertical timeline.
 *
 * Displays the full programme hierarchy: header with progress,
 * then phase timeline cards with scroll-driven reveal animation.
 */
export const ProgrammePage: React.FC = () => {
  const { data: detail, isLoading, isError } = useProgrammeDetailQuery();

  if (isLoading) {
    return <PageLoadingState message="Loading your programme..." />;
  }

  if (isError || !detail) {
    return (
      <PageContainer centred maxWidth="narrow">
        <EmptyProgrammeState />
      </PageContainer>
    );
  }

  const { programme, phases } = detail;
  const completedPhases = phases.filter((p) => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-muted/20">
      <PageContainer centred maxWidth="narrow">
        <ProgrammeHeader
          name={programme.name}
          description={programme.description}
          completedPhases={completedPhases}
          totalPhases={phases.length}
        />

        {/* Timeline — Group 2 will add PhaseTimelineCard components here */}
      </PageContainer>
    </div>
  );
};
