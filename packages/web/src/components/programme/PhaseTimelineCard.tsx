import { useInView } from 'motion/react';
import { useRef } from 'react';

import type { ProgrammeDetailResponse } from '@ffp/core';

import type { BadgeProps } from '@web/components/atoms';
import { Badge, Icons, ProgressBar, Text, Title } from '@web/components/atoms';
import { Card, PrescriptionBadge } from '@web/components/molecules';
import { ExpandableSection, FadeSlideIn, TimelineLine } from '@web/components/motion';

import { PHASE_STATUS_BADGES } from './programme-status-badges';
import { SessionRow } from './SessionRow';
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

const UP_NEXT_BADGE: BadgeProps = { label: 'Up Next', variant: 'brand', appearance: 'solid' };

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
 * Upcoming phases show only a badge with the session count.
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
  // Accessible if completed/in_progress, or if the backend sent exercise data (next phase to start)
  const isAccessible =
    phase.status === 'completed' ||
    phase.status === 'in_progress' ||
    phase.sessions.some((s) => s.exercises !== undefined);

  const completedSessions = phase.sessions.filter(
    (s) => s.userSession?.status === 'completed'
  ).length;
  const totalSessions = phase.sessions.length;
  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const isNextPhase = phase.status === 'not_started' && isAccessible;
  const statusBadge = isNextPhase ? UP_NEXT_BADGE : PHASE_STATUS_BADGES[phase.status];

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
              phase.status === 'in_progress' || (phase.status === 'not_started' && isAccessible)
                ? 'ring-1 ring-ffp-dark-blue/10'
                : ''
            } ${phase.status === 'not_started' && !isAccessible ? 'opacity-70' : ''}`}
          >
            <div className="p-5">
              {/* Header — always visible */}
              <div className="mb-1">
                <Badge {...statusBadge} shape="md" />
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
                  <ProgressBar
                    percent={progressPercent}
                    aria-label="Phase session progress"
                    className="mb-4"
                  />

                  {/* Sessions list — 2-col on desktop, stacked on tablet */}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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

              {/* Expanded content — upcoming phases: the session count only */}
              <ExpandableSection isVisible={isExpanded && !isAccessible} duration={0.3}>
                <div className="mt-3">
                  <PrescriptionBadge
                    label={`${String(totalSessions)} sessions`}
                    icon={Icons.REPEAT}
                    variant="blue"
                    size="sm"
                  />
                </div>
              </ExpandableSection>
            </div>
          </Card>
        </FadeSlideIn>
      </div>
    </div>
  );
};
