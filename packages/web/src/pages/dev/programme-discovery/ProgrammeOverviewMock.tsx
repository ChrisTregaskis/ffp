import { AnimatePresence, motion, useInView } from 'motion/react';
import { useMemo, useRef } from 'react';
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
  getCurrentSession,
  getCompletedPhasesCount,
  getCompletedSessionsCount,
} from './mock-data';

import type { MockPhase, MockSession } from './mock-data';

/**
 * Discovery prototype: Programme Overview Page
 *
 * Vertical timeline with scroll-driven reveal. Phase cards start compact
 * and expand as user scrolls them into view. The timeline line animates
 * downward to connect each phase node.
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

// ─── Timeline Node ───────────────────────────────────────────────────────────

interface TimelineNodeProps {
  status: 'completed' | 'in_progress' | 'not_started';
  phaseNumber: number;
  isVisible: boolean;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({ status, phaseNumber, isVisible }) => {
  const baseClasses =
    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-500';

  if (status === 'completed') {
    return (
      <motion.div
        className={`${baseClasses} bg-ffp-green`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Icon name={Icons.CHECK} styleProps={{ size: 'sm', colour: '#ffffff' }} />
      </motion.div>
    );
  }

  if (status === 'in_progress') {
    return (
      <motion.div
        className={`${baseClasses} bg-ffp-dark-blue`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Text styleProps={{ size: 'sm', weight: 'bold', colour: 'white' }}>
          {String(phaseNumber)}
        </Text>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} border-2 border-border bg-white`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
        {String(phaseNumber)}
      </Text>
    </motion.div>
  );
};

// ─── Session Row ─────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: MockSession;
  isNext: boolean;
  onStart: () => void;
}

const SessionRow: React.FC<SessionRowProps> = ({ session, isNext, onStart }) => (
  <div
    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
      isNext
        ? 'bg-ffp-dark-blue/5 ring-1 ring-ffp-dark-blue/20'
        : session.status === 'completed'
          ? 'bg-muted/30'
          : ''
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {session.status === 'completed' ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ffp-green">
            <Icon name={Icons.CHECK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
          </span>
        ) : isNext ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ffp-dark-blue">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border">
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              {String(session.sessionNumber)}
            </Text>
          </span>
        )}
      </span>

      <div>
        <Text
          styleProps={{
            size: 'sm',
            weight: isNext ? 'medium' : 'normal',
            colour: session.status === 'completed' ? 'muted-foreground' : 'foreground',
          }}
        >
          {session.name}
        </Text>
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {String(session.exercises.length)} exercises · {String(session.estimatedDurationMinutes)}{' '}
          min
        </Text>
      </div>
    </div>

    {isNext && (
      <Button variant="primary" size="sm" onClick={onStart}>
        <Icon name={Icons.PLAY} styleProps={{ size: 'xs', colour: '#ffffff' }} />
        {session.status === 'in_progress' ? 'Continue' : 'Start'}
      </Button>
    )}
  </div>
);

// ─── Phase Timeline Card ─────────────────────────────────────────────────────

interface PhaseTimelineCardProps {
  phase: MockPhase;
  isFirst: boolean;
  isLast: boolean;
  nextSession: MockSession | null;
  onStartSession: () => void;
}

const PhaseTimelineCard: React.FC<PhaseTimelineCardProps> = ({
  phase,
  isFirst,
  isLast,
  nextSession,
  onStartSession,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });

  const completedSessions = getCompletedSessionsCount(phase);
  const totalSessions = phase.sessions.length;
  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const isAccessible = phase.status === 'completed' || phase.status === 'in_progress';

  // First phase is always expanded; others expand on scroll
  const isExpanded = isFirst || isInView;

  const statusLabel =
    phase.status === 'completed'
      ? 'Complete'
      : phase.status === 'in_progress'
        ? 'In Progress'
        : 'Upcoming';

  const statusColour =
    phase.status === 'completed'
      ? 'bg-ffp-green'
      : phase.status === 'in_progress'
        ? 'bg-ffp-dark-blue'
        : 'bg-muted text-muted-foreground';

  // Timeline line colour: green for completed, dark blue for in_progress, grey for future
  const lineColour =
    phase.status === 'completed'
      ? 'bg-ffp-green'
      : phase.status === 'in_progress'
        ? 'bg-ffp-dark-blue'
        : 'bg-border';

  return (
    <div ref={ref} className="flex gap-4">
      {/* Timeline line + node */}
      <div className="flex flex-col items-center">
        <TimelineNode
          status={phase.status}
          phaseNumber={phase.phaseNumber}
          isVisible={isExpanded}
        />
        {!isLast && (
          <motion.div
            className={`w-0.5 flex-1 origin-top ${lineColour}`}
            initial={{ scaleY: isFirst ? 1 : 0 }}
            animate={isExpanded ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          />
        )}
      </div>

      {/* Phase content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-8'}`}>
        <motion.div
          initial={isFirst ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          animate={isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <Card
            className={`${
              phase.status === 'in_progress' ? 'ring-1 ring-ffp-dark-blue/20' : ''
            } ${phase.status === 'not_started' ? 'opacity-70' : ''}`}
          >
            <div className="p-5">
              {/* Header — always visible */}
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ${statusColour}`}
                >
                  {statusLabel}
                </span>
              </div>
              <Title as="h4" className="mb-1">
                Phase {String(phase.phaseNumber)}: {phase.name}
              </Title>
              <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                {phase.description}
              </Text>

              {/* Expandable content */}
              <AnimatePresence>
                {isExpanded && isAccessible && (
                  <motion.div
                    initial={isFirst ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                          {String(completedSessions)} of {String(totalSessions)} sessions
                        </Text>
                      </div>
                      <ProgressBar percent={progressPercent} className="mb-4" />

                      {/* Sessions list */}
                      <div className="space-y-2">
                        {phase.sessions.map((session) => {
                          const isNextSession = nextSession?.id === session.id;

                          return (
                            <SessionRow
                              key={session.id}
                              session={session}
                              isNext={isNextSession}
                              onStart={onStartSession}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upcoming phase — expand to show sessions pill on scroll */}
              <AnimatePresence>
                {isExpanded && !isAccessible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-ffp-dark-blue px-2 py-1 text-xs font-medium text-white">
                        <Icon name={Icons.REPEAT} styleProps={{ size: 'xs', colour: '#ffffff' }} />
                        {String(totalSessions)} sessions
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Main Programme Overview Page ────────────────────────────────────────────

export const ProgrammeOverviewMock: React.FC = () => {
  const navigate = useNavigate();
  const nextSession = useMemo(() => getCurrentSession(), []);
  const completedPhases = useMemo(() => getCompletedPhasesCount(), []);
  const totalPhases = mockProgramme.phases.length;
  const programmeProgressPercent = (completedPhases / totalPhases) * 100;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Programme Header */}
        <FadeSlideIn delay={0.1}>
          <div className="mb-8">
            <Title as="h1" className="mb-2">
              {mockProgramme.name}
            </Title>
            <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-4">
              {mockProgramme.description}
            </Text>

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
            <ProgressBar percent={programmeProgressPercent} />
          </div>
        </FadeSlideIn>

        {/* Timeline */}
        <div>
          {mockProgramme.phases.map((phase, index) => (
            <PhaseTimelineCard
              key={phase.id}
              phase={phase}
              isFirst={index === 0}
              isLast={index === mockProgramme.phases.length - 1}
              nextSession={nextSession}
              onStartSession={() => {
                void navigate('/components/programme/session');
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
