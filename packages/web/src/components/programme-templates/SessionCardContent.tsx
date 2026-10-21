import React from 'react';

import { Text } from '@web/components/atoms';

import { ExerciseList } from './ExerciseList';
import { SlotList } from './SlotList';

export interface SessionCardContentProps {
  sessionId: string;
  /** Template ID for exercise cache invalidation */
  templateId: string;
  /** Exercise count from template detail (for initial display before query loads) */
  exerciseCount: number;
}

/** A session's slot recipe above the fixed exercises programmes still copy. */
export const SessionCardContent: React.FC<SessionCardContentProps> = ({
  sessionId,
  templateId,
  exerciseCount,
}) => (
  <div className="space-y-6">
    <section>
      <Text as="p" variant="eyebrow">
        Slots
      </Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mb-2">
        Each slot names the pool one exercise is drawn from when a programme is built.
      </Text>
      <SlotList sessionId={sessionId} />
    </section>

    <section>
      <Text as="p" variant="eyebrow">
        Fixed exercises
      </Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mb-2">
        The exercises programmes copy for this session today.
      </Text>
      <ExerciseList sessionId={sessionId} templateId={templateId} exerciseCount={exerciseCount} />
    </section>
  </div>
);
