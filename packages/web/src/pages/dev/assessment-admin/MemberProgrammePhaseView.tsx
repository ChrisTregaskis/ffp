import { useState } from 'react';

import { Text } from '@web/components/text';

import { InfoNote } from './InfoNote';
import { ProgrammeSessionCard } from './ProgrammeSessionCard';
import { PROGRAMME_STATUS_LABELS, USERS } from './prototype-users';
import { usePrototypeStore } from './PrototypeStore';
import { ViewHeader } from './ViewHeader';

interface MemberProgrammePhaseViewProps {
  memberId: string;
  phaseId: string;
}

/** Sessions within a phase — dig into a session to reorder, swap, add or remove exercises. */
export const MemberProgrammePhaseView: React.FC<MemberProgrammePhaseViewProps> = ({
  memberId,
  phaseId,
}) => {
  const {
    navigate,
    memberStructures,
    swapMemberExercise,
    removeMemberExercise,
    moveMemberExercise,
    moveMemberSession,
    addMemberExercise,
  } = usePrototypeStore();
  const user = USERS.find((item) => item.id === memberId);
  const phase = (memberStructures[memberId] ?? []).find((item) => item.id === phaseId);

  const [isNoteOpen, setIsNoteOpen] = useState(true);

  const goBack = (): void => {
    navigate({ name: 'member-programme', memberId });
  };

  if (!user?.programme || !phase) {
    return <ViewHeader title="Phase not found" backLabel="Back to programme" onBack={goBack} />;
  }

  const { level } = user.programme;

  return (
    <div className="max-w-2xl">
      <ViewHeader
        title={`${phase.weeks} · ${phase.name}`}
        subtitle={`${user.firstName} ${user.lastName} · ${user.programme.name} · ${PROGRAMME_STATUS_LABELS[user.programme.status]}`}
        backLabel="Back to programme"
        onBack={goBack}
      />

      {/* The central real-build finding: where a session's exercises actually come from. */}
      {isNoteOpen && (
        <div className="mb-4">
          <InfoNote
            onDismiss={() => {
              setIsNoteOpen(false);
            }}
          >
            In the live system a session&rsquo;s exercises come from the shared programme template,
            so editing them would change the programme for every member on it. Per-member edits need
            an override layer — the key real-build decision. Edits here are mock, scoped to this
            member.
          </InfoNote>
        </div>
      )}

      {/* Phase summary */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {phase.description}
        </Text>
      </div>

      <div className="space-y-3">
        {phase.sessions.map((session, index) => (
          <ProgrammeSessionCard
            key={session.id}
            session={session}
            level={level}
            isFirst={index === 0}
            isLast={index === phase.sessions.length - 1}
            onMoveUp={() => {
              moveMemberSession(memberId, session.id, 'up');
            }}
            onMoveDown={() => {
              moveMemberSession(memberId, session.id, 'down');
            }}
            onSwapExercise={(exerciseId) => {
              swapMemberExercise(memberId, exerciseId);
            }}
            onRemoveExercise={(exerciseId) => {
              removeMemberExercise(memberId, exerciseId);
            }}
            onMoveExercise={(exerciseId, direction) => {
              moveMemberExercise(memberId, exerciseId, direction);
            }}
            onAddExercise={(videoId) => {
              addMemberExercise(memberId, session.id, videoId);
            }}
          />
        ))}
      </div>
    </div>
  );
};
