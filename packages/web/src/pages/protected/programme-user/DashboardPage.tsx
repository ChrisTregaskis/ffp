import { PageContainer } from '@web/components/layout/PageContainer';
import { PageHeader } from '@web/components/layout/PageHeader';
import { PageLoadingState } from '@web/components/layout/PageLoadingState';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { EmptyProgrammeState } from '@web/components/programme/EmptyProgrammeState';
import { NextSessionCard } from '@web/components/programme/NextSessionCard';
import { PhaseDetailCard } from '@web/components/programme/PhaseDetailCard';
import { ProgrammeCompleteState } from '@web/components/programme/ProgrammeCompleteState';
import { useProgrammeDetailQuery, useProgressSummaryQuery } from '@web/hooks/programmes';
import { useUserProfileQuery } from '@web/hooks/users';
import { findCurrentPhase, findNextSession } from '@web/utils/programme';
import { getGreeting } from '@web/utils/time';

/**
 * Dashboard page for programme users.
 */
export const DashboardPage: React.FC = () => {
  const { data: profile } = useUserProfileQuery();
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

  const displayName = profile?.firstName ?? '';
  const greeting = displayName ? `${getGreeting()}, ${displayName}` : getGreeting();

  // Loading state — centred vertically
  if (isLoading) {
    return <PageLoadingState message="Loading your dashboard..." />;
  }

  // Error or no data — show empty programme state
  if (isError || !detail || !progress) {
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
