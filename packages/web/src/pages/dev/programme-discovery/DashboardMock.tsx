import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card/Card';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import {
  mockProgramme,
  getCurrentPhase,
  getCurrentSession,
  getCompletedPhasesCount,
  getCompletedSessionsCount,
  MOCK_VIDEO_URL,
} from './mock-data';

import type { MockPhase, MockSession } from './mock-data';

/**
 * Discovery prototype: Dashboard Page
 *
 * The user's landing page. Primary CTA is "Your Next Session" —
 * inviting, not pressuring. Shows programme context and progress
 * as narrative, not just numbers.
 */

// ─── Progress Bar ────────────────────────────────────────────────────────────

interface ProgressBarProps {
  percent: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, className = '' }) => (
  <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-ffp-primary-blue to-ffp-dark-blue"
      initial={{ width: 0 }}
      animate={{ width: `${String(Math.min(100, Math.max(0, percent)))}%` }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
    />
  </div>
);

// ─── Next Session Card ───────────────────────────────────────────────────────

interface NextSessionCardProps {
  session: MockSession;
  phase: MockPhase;
  onStart: () => void;
  onViewProgramme: () => void;
}

const NextSessionCard: React.FC<NextSessionCardProps> = ({
  session,
  phase,
  onStart,
  onViewProgramme,
}) => {
  const isResumable = session.status === 'in_progress';
  const completedExercises = session.exercises.filter((e) => e.completed).length;

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Video preview */}
        <div className="relative overflow-hidden rounded-lg lg:w-2/5">
          <video
            src={MOCK_VIDEO_URL}
            className="aspect-video w-full rounded-lg object-cover lg:h-full"
            muted
            playsInline
            loop
            autoPlay
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-5 lg:p-6">
          <div>
            <Text
              as="p"
              styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
              className="mb-1 uppercase tracking-wide"
            >
              {isResumable ? 'Continue where you left off' : 'Your next session'}
            </Text>
            <Title as="h3" className="mb-1">
              {session.name}
            </Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
              Phase {String(phase.phaseNumber)}: {phase.name} · Session{' '}
              {String(session.sessionNumber)} of {String(phase.sessions.length)}
            </Text>

            {isResumable && (
              <div className="mb-4">
                <Text
                  as="p"
                  styleProps={{ size: 'xs', colour: 'muted-foreground' }}
                  className="mb-1"
                >
                  {String(completedExercises)} of {String(session.exercises.length)} exercises done
                </Text>
                <ProgressBar percent={(completedExercises / session.exercises.length) * 100} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-ffp-dark-blue px-2 py-1 text-xs font-medium text-white">
                <Icon name={Icons.REPEAT} styleProps={{ size: 'xs', colour: '#ffffff' }} />
                {String(session.exercises.length)} exercises
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-ffp-dark-blue px-2 py-1 text-xs font-medium text-white">
                <Icon name={Icons.CLOCK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
                {String(session.estimatedDurationMinutes)} min
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="neutral" size="md" onClick={onViewProgramme}>
              View Programme
            </Button>
            <Button variant="primary" size="md" onClick={onStart}>
              <Icon name={Icons.PLAY} styleProps={{ size: 'sm', colour: '#ffffff' }} />
              {isResumable ? 'Continue Session' : 'Start Session'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyProgrammeState: React.FC = () => (
  <Card className="py-12 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <Icon
        name={Icons.CLIPBOARDLIST}
        styleProps={{ size: 'xl', colour: 'var(--color-muted-foreground)' }}
      />
    </div>
    <Title as="h3" className="mb-2">
      No active programme
    </Title>
    <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mx-auto max-w-sm">
      Your personalised programme will appear here once your assessment has been completed and
      reviewed.
    </Text>
  </Card>
);

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export const DashboardMock: React.FC = () => {
  const navigate = useNavigate();

  const currentPhase = useMemo(() => getCurrentPhase(), []);
  const currentSession = useMemo(() => getCurrentSession(), []);
  const completedPhases = useMemo(() => getCompletedPhasesCount(), []);

  const totalPhases = mockProgramme.phases.length;

  const currentPhaseCompletedSessions = currentPhase ? getCompletedSessionsCount(currentPhase) : 0;
  const currentPhaseTotalSessions = currentPhase ? currentPhase.sessions.length : 0;
  const phaseProgressPercent =
    currentPhaseTotalSessions > 0
      ? (currentPhaseCompletedSessions / currentPhaseTotalSessions) * 100
      : 0;

  const hasProgramme = mockProgramme.status === 'active';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Greeting */}
        <FadeSlideIn>
          <div className="mb-8">
            <Title as="h1" className="mb-1">
              Good morning, Sarah
            </Title>
            <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
              {hasProgramme
                ? "Here's where you are in your programme."
                : 'Welcome to Fit For Purpose.'}
            </Text>
          </div>
        </FadeSlideIn>

        {!hasProgramme ? (
          <FadeSlideIn delay={0.1}>
            <EmptyProgrammeState />
          </FadeSlideIn>
        ) : (
          <>
            {/* Next Session Card */}
            {currentSession && currentPhase && (
              <FadeSlideIn delay={0.1}>
                <div className="mb-8">
                  <NextSessionCard
                    session={currentSession}
                    phase={currentPhase}
                    onStart={() => {
                      void navigate('/components/programme/session');
                    }}
                    onViewProgramme={() => {
                      void navigate('/components/programme/overview');
                    }}
                  />
                </div>
              </FadeSlideIn>
            )}

            {/* Current Phase Detail */}
            {currentPhase && (
              <FadeSlideIn delay={0.2}>
                <Card>
                  <div className="p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-ffp-dark-blue px-2 py-0.5 text-xs font-medium text-white">
                        Current
                      </span>
                      <Title as="h4">
                        Phase {String(currentPhase.phaseNumber)}: {currentPhase.name}
                      </Title>
                    </div>
                    <Text
                      as="p"
                      styleProps={{ size: 'sm', colour: 'muted-foreground' }}
                      className="mb-4"
                    >
                      {currentPhase.description}
                    </Text>

                    <div className="mb-2 flex items-center justify-between">
                      <Text
                        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
                        className="uppercase tracking-wide"
                      >
                        Phase Progress
                      </Text>
                      <Text styleProps={{ size: 'sm', weight: 'medium' }}>
                        {String(currentPhaseCompletedSessions)} of{' '}
                        {String(currentPhaseTotalSessions)} sessions
                      </Text>
                    </div>
                    <ProgressBar percent={phaseProgressPercent} className="mb-4" />

                    {/* Session dots */}
                    <div className="flex gap-2">
                      {currentPhase.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                            session.status === 'completed'
                              ? 'bg-ffp-green text-white'
                              : session.status === 'in_progress'
                                ? 'bg-ffp-dark-blue text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {session.status === 'completed' ? (
                            <Icon
                              name={Icons.CHECK}
                              styleProps={{ size: 'xs', colour: '#ffffff' }}
                            />
                          ) : (
                            String(session.sessionNumber)
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </FadeSlideIn>
            )}

            {/* Programme Overview */}
            <FadeSlideIn delay={0.3}>
              <Card className="mt-6">
                <div className="p-5">
                  <div className="mb-4">
                    <Title as="h3" className="mb-1">
                      {mockProgramme.name}
                    </Title>
                    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                      {mockProgramme.description}
                    </Text>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <Text
                      styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
                      className="uppercase tracking-wide"
                    >
                      Programme Progress
                    </Text>
                    <Text styleProps={{ size: 'sm', weight: 'medium' }}>
                      {String(completedPhases)} of {String(totalPhases)} phases
                    </Text>
                  </div>
                  <ProgressBar percent={(completedPhases / totalPhases) * 100} />
                </div>
              </Card>
            </FadeSlideIn>
          </>
        )}
      </div>
    </div>
  );
};
