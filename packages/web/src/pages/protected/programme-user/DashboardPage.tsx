import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { EmptyProgrammeState } from '@web/components/programme/EmptyProgrammeState';
import { NextSessionCard } from '@web/components/programme/NextSessionCard';
import { PhaseDetailCard } from '@web/components/programme/PhaseDetailCard';
import { ProgrammeCompleteState } from '@web/components/programme/ProgrammeCompleteState';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';
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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Loading your dashboard...
          </Text>
        </div>
      </div>
    );
  }

  // Error or no data — show empty programme state
  if (isError || !detail || !progress) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <Title as="h1" className="mb-1">
            {greeting}
          </Title>
        </div>
        <EmptyProgrammeState />
      </div>
    );
  }

  const currentPhase = findCurrentPhase(detail.phases, detail.currentPhaseNumber);
  const nextSession = currentPhase ? findNextSession(currentPhase) : undefined;
  const isProgrammeComplete =
    detail.programme.status === 'completed' ||
    (progress.completedPhases === progress.totalPhases && progress.totalPhases > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Greeting */}
      <FadeSlideIn>
        <div className="mb-8">
          <Title as="h1" className="mb-1">
            {greeting}
          </Title>
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
            {isProgrammeComplete
              ? 'Congratulations on completing your programme.'
              : "Here's where you are in your programme."}
          </Text>
        </div>
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
    </div>
  );
};
