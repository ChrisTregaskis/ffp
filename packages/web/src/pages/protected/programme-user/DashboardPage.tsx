import type { ProgrammeDetailResponse } from '@ffp/core';

import { PageContainer } from '@web/components/layout';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { EmptyProgrammeState } from '@web/components/programme/EmptyProgrammeState';
import { NextSessionCard } from '@web/components/programme/NextSessionCard';
import { PhaseDetailCard } from '@web/components/programme/PhaseDetailCard';
import { ProgrammeOverviewCard } from '@web/components/programme/ProgrammeOverviewCard';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';
import { useProgrammeDetailQuery, useProgressSummaryQuery } from '@web/hooks/programmes';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

/** Find the current phase (first in_progress or not_started) */
const findCurrentPhase = (
  phases: Phase[],
  currentPhaseNumber: number | null
): Phase | undefined => {
  if (currentPhaseNumber !== null) {
    return phases.find((p) => p.phaseNumber === currentPhaseNumber);
  }

  return phases.find((p) => p.status === 'in_progress' || p.status === 'not_started');
};

/** Find the next uncompleted session in a phase */
const findNextSession = (phase: Phase): Session | undefined => {
  return phase.sessions.find((s) => {
    const status = s.userSession?.status;

    return !status || status === 'not_started' || status === 'in_progress';
  });
};

/**
 * Dashboard page for programme users.
 */
export const DashboardPage: React.FC = () => {
  const {
    data: detail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useProgrammeDetailQuery();
  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useProgressSummaryQuery();

  const isLoading = isDetailLoading || isProgressLoading;
  const isError = isDetailError || isProgressError;

  // Loading state
  if (isLoading) {
    return (
      <PageContainer centred>
        <div className="flex flex-col items-center gap-4 py-16">
          <LoadingSpinner size="lg" />
          <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Loading your dashboard...
          </Text>
        </div>
      </PageContainer>
    );
  }

  // Error or no data — show empty programme state
  if (isError || !detail || !progress) {
    return (
      <PageContainer centred>
        <div className="mb-8">
          <Title as="h1" className="mb-1">
            Dashboard
          </Title>
        </div>
        <EmptyProgrammeState />
      </PageContainer>
    );
  }

  const currentPhase = findCurrentPhase(detail.phases, detail.currentPhaseNumber);
  const nextSession = currentPhase ? findNextSession(currentPhase) : undefined;

  const currentPhaseLabel =
    progress.currentPhaseNumber !== null && currentPhase?.name
      ? `Phase ${String(progress.currentPhaseNumber)}: ${currentPhase.name}`
      : null;

  return (
    <PageContainer centred>
      {/* Greeting */}
      <FadeSlideIn>
        <div className="mb-8">
          <Title as="h1" className="mb-1">
            Dashboard
          </Title>
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
            Here&apos;s where you are in your programme.
          </Text>
        </div>
      </FadeSlideIn>

      {/* Your Next Session hero card — full width */}
      {nextSession && currentPhase && (
        <FadeSlideIn delay={0.1}>
          <div className="mb-6">
            <NextSessionCard
              session={nextSession}
              phase={currentPhase}
              totalPhaseSessions={currentPhase.sessions.length}
            />
          </div>
        </FadeSlideIn>
      )}

      {/* Phase detail and programme overview — 2-col on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Phase Detail */}
        {currentPhase && (
          <FadeSlideIn delay={0.2}>
            <PhaseDetailCard
              phase={currentPhase}
              progressPercent={progress.currentPhaseProgressPercent}
            />
          </FadeSlideIn>
        )}

        {/* Programme Overview */}
        <FadeSlideIn delay={0.3}>
          <ProgrammeOverviewCard
            programmeName={progress.programmeName}
            currentPhaseLabel={currentPhaseLabel}
            overallProgressPercent={progress.overallProgressPercent}
            completedPhases={progress.completedPhases}
            totalPhases={progress.totalPhases}
          />
        </FadeSlideIn>
      </div>
    </PageContainer>
  );
};
