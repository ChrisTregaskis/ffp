import { useInView } from 'motion/react';
import { useRef } from 'react';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { Card } from '@web/components/Card/Card';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';
import { ProgressBar } from '@web/components/ProgressBar/ProgressBar';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import { ExpandableSection } from './ExpandableSection';
import { SessionCountPill } from './SessionCountPill';
import { SessionRow } from './SessionRow';
import { StatusBadge } from './StatusBadge';
import { TimelineLine } from './TimelineLine';
import { TimelineNode } from './TimelineNode';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

export interface PhaseTimelineCardProps {
  /** Phase data from programme detail response */
  phase: Phase;
  /** Whether this is the first phase (always expanded on load) */
  isFirst: boolean;
  /** Whether this is the last phase (hides connecting line) */
  isLast: boolean;
  /** The next session the user should start/continue (if in this phase) */
  nextSession: Session | undefined;
}

const STATUS_BADGE_MAP: Record<
  Phase['status'],
  { label: string; variant: 'completed' | 'current' | 'upcoming' }
> = {
  completed: { label: 'Complete', variant: 'completed' },
  in_progress: { label: 'In Progress', variant: 'current' },
  not_started: { label: 'Upcoming', variant: 'upcoming' },
};

const LINE_COLOUR_MAP: Record<Phase['status'], string> = {
  completed: 'bg-ffp-green',
  in_progress: 'bg-ffp-dark-blue',
  not_started: 'bg-border',
};

/**
 * Phase card on the vertical timeline with scroll-driven reveal.
 *
 * Starts compact and expands when scrolled into view (first phase always expanded).
 * Current/completed phases show progress bar and session list.
 * Upcoming phases show only a session count pill.
 */
export const PhaseTimelineCard: React.FC<PhaseTimelineCardProps> = ({
  phase,
  isFirst,
  isLast,
  nextSession,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });

  const isExpanded = isFirst || isInView;
  const isAccessible = phase.status === 'completed' || phase.status === 'in_progress';

  const completedSessions = phase.sessions.filter(
    (s) => s.userSession?.status === 'completed'
  ).length;
  const totalSessions = phase.sessions.length;
  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const { label: statusLabel, variant: statusVariant } = STATUS_BADGE_MAP[phase.status];

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
          <TimelineLine
            colourClassName={LINE_COLOUR_MAP[phase.status]}
            skipInitialAnimation={isFirst}
            isExpanded={isExpanded}
          />
        )}
      </div>

      {/* Phase content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-8'}`}>
        <FadeSlideIn delay={isFirst ? 0 : 0.1} duration={isFirst ? 0 : 0.4} slideDistance={15}>
          <Card
            className={`${
              phase.status === 'in_progress' ? 'ring-1 ring-ffp-dark-blue/10' : ''
            } ${phase.status === 'not_started' ? 'opacity-70' : ''}`}
          >
            <div className="p-5">
              {/* Header — always visible */}
              <div className="mb-1">
                <StatusBadge label={statusLabel} variant={statusVariant} />
              </div>
              <Title as="h4" className="mb-1">
                Phase {String(phase.phaseNumber)}
                {phase.name ? `: ${phase.name}` : ''}
              </Title>
              {phase.description && (
                <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                  {phase.description}
                </Text>
              )}

              {/* Expanded content — current/completed phases: progress + sessions */}
              <ExpandableSection
                isVisible={isExpanded && isAccessible}
                skipInitialAnimation={isFirst}
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
                    {phase.sessions.map((session) => (
                      <SessionRow
                        key={session.templateSessionId}
                        session={session}
                        phasePublicId={phase.publicId}
                        isNext={nextSession?.templateSessionId === session.templateSessionId}
                      />
                    ))}
                  </div>
                </div>
              </ExpandableSection>

              {/* Expanded content — upcoming phases: session count pill only */}
              <ExpandableSection isVisible={isExpanded && !isAccessible} duration={0.3}>
                <div className="mt-3">
                  <SessionCountPill count={totalSessions} />
                </div>
              </ExpandableSection>
            </div>
          </Card>
        </FadeSlideIn>
      </div>
    </div>
  );
};
