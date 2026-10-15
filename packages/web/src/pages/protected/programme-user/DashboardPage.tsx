import { useCallback } from 'react';

import { PageContainer } from '@web/components/atoms';
import { LoadingState, PageHeader } from '@web/components/molecules';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { EmptyProgrammeState } from '@web/components/programme/EmptyProgrammeState';
import { NextSessionCard } from '@web/components/programme/NextSessionCard';
import { PhaseDetailCard } from '@web/components/programme/PhaseDetailCard';
import { ProgrammeCompleteState } from '@web/components/programme/ProgrammeCompleteState';
import { ProgrammeLoadError } from '@web/components/programme/ProgrammeLoadError';
import { useProgrammeDetailQuery, useProgressSummaryQuery } from '@web/hooks/programmes';
import { useUserProfileQuery } from '@web/hooks/users';
import { findCurrentPhase, findNextSession, isProgrammeLoadFailure } from '@web/utils/programme';
import { getGreeting } from '@web/utils/time';

/**
 * Dashboard page for programme users.
 */
export const DashboardPage: React.FC = () => {
  const { data: profile } = useUserProfileQuery();
  const {
    data: detail,
    isPending: isDetailPending,
    error: detailError,
    refetch: refetchDetail,
  } = useProgrammeDetailQuery();
  const {
    data: progress,
    isPending: isProgressPending,
    error: progressError,
    refetch: refetchProgress,
  } = useProgressSummaryQuery();

  // Pending, not loading: a retry paused while the tab is hidden has no data and no error yet
  const isPending = isDetailPending || isProgressPending;
  const isLoadFailure =
    isProgrammeLoadFailure(detailError) || isProgrammeLoadFailure(progressError);

  const handleRetry = useCallback(() => {
    void refetchDetail();
    void refetchProgress();
  }, [refetchDetail, refetchProgress]);

  const displayName = profile?.firstName ?? '';
  const greeting = displayName ? `${getGreeting()}, ${displayName}` : getGreeting();

  // Loading state — centred vertically
  if (isPending) {
    return <LoadingState layout="page" message="Loading your dashboard..." />;
  }

  // A failed refetch keeps the data it had, so only fail when there is nothing to show
  if (isLoadFailure && (!detail || !progress)) {
    return (
      <PageContainer centred maxWidth="medium">
        <PageHeader title={greeting} />
        <ProgrammeLoadError onRetry={handleRetry} />
      </PageContainer>
    );
  }

  // No active programme: both queries answer not-found
  if (!detail || !progress) {
    return (
      <PageContainer centred maxWidth="medium">
        <PageHeader title={greeting} />
        <EmptyProgrammeState />
      </PageContainer>
    );
  }

  const currentPhase = findCurrentPhase(detail.phases, detail.currentPhaseNumber);
  const nextSession = currentPhase ? findNextSession(currentPhase) : undefined;
  const isProgrammeComplete =
    detail.programme.status === 'completed' ||
    (progress.completedPhases === progress.totalPhases && progress.totalPhases > 0);

  return (
    <PageContainer centred maxWidth="medium">
      {/* Greeting */}
      <FadeSlideIn>
        <PageHeader
          title={greeting}
          subtitle={
            isProgrammeComplete
              ? 'Congratulations on completing your programme.'
              : "Here's where you are in your programme."
          }
        />
      </FadeSlideIn>

      {isProgrammeComplete ? (
        <FadeSlideIn delay={0.1}>
          <ProgrammeCompleteState
            completedPhases={progress.completedPhases}
            completedSessions={progress.completedSessions}
          />
        </FadeSlideIn>
      ) : (
        <>
          {/* Your Next Session hero card — full width */}
          {nextSession && currentPhase && (
            <FadeSlideIn delay={0.1}>
              <div className="mb-6">
                <NextSessionCard
                  session={nextSession}
                  phase={currentPhase}
                  totalPhaseSessions={currentPhase.sessions.length}
                  totalPhases={progress.totalPhases}
                />
              </div>
            </FadeSlideIn>
          )}

          {/* Current Phase Detail */}
          {currentPhase && (
            <FadeSlideIn delay={0.2}>
              <PhaseDetailCard
                phase={currentPhase}
                progressPercent={progress.currentPhaseProgressPercent}
              />
            </FadeSlideIn>
          )}
        </>
      )}
    </PageContainer>
  );
};
