import { Table } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { Text } from '@web/components/text';

import { buildPhaseColumns, type PhaseRow } from './phaseListColumns';
import { LEVEL_META, levelTitle } from './prototype-level-model';
import { focusLabel, GOALS } from './prototype-programmes';
import { PROGRAMME_STATUS_LABELS, USERS } from './prototype-users';
import { usePrototypeStore } from './PrototypeStore';
import { TagChip } from './TagChip';
import { ViewHeader } from './ViewHeader';

const goalLabel = (goalId: string): string =>
  GOALS.find((goal) => goal.id === goalId)?.label ?? goalId;

/** A member's programme overview — general info plus the phases table to drill into. */
export const MemberProgrammeDetailView: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { navigate, memberStructures } = usePrototypeStore();
  const user = USERS.find((item) => item.id === memberId);

  const goBack = (): void => {
    navigate({ name: 'member-programmes' });
  };

  if (!user?.programme) {
    return (
      <ViewHeader
        title="Member programme not found"
        backLabel="Back to member programmes"
        onBack={goBack}
      />
    );
  }

  const { programme } = user;
  const phases = memberStructures[memberId] ?? [];

  const rows: PhaseRow[] = phases.map((phase, index) => ({
    phaseId: phase.id,
    order: index + 1,
    name: phase.name,
    weeks: phase.weeks,
    sessionsLabel: `${String(phase.sessions.length)} sessions`,
  }));

  const phaseActions = (row: PhaseRow): RowAction<PhaseRow>[] => [
    {
      label: 'View sessions',
      onClick: () => {
        navigate({ name: 'member-programme-phase', memberId, phaseId: row.phaseId });
      },
    },
  ];

  return (
    <div>
      <ViewHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={`${programme.name} · ${PROGRAMME_STATUS_LABELS[programme.status]}`}
        backLabel="Back to member programmes"
        onBack={goBack}
      />

      {/* Programme overview — title, description and the key areas it hits */}
      <div className="mb-5 rounded-lg border border-border bg-card p-4">
        <Text styleProps={{ size: 'lg', weight: 'semibold' }}>{programme.name}</Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-0.5">
          {LEVEL_META[programme.level].tagline}. Generated from the assessment result; dig into a
          phase to view and tune its sessions.
        </Text>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <TagChip label={levelTitle(programme.level)} tone="primary" />
          <TagChip label={goalLabel(programme.goalId)} tone="info" />
          {programme.focusIds.map((focusId) => (
            <TagChip key={focusId} label={focusLabel(focusId)} tone="muted" />
          ))}
        </div>
      </div>

      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Phases</Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mb-2 mt-0.5">
        The 12-week plan, in blocks. Open a phase to reach its sessions and exercises.
      </Text>

      <Table<PhaseRow>
        tableId="member-programme-phases"
        data={rows}
        columns={buildPhaseColumns(phaseActions)}
        totalRows={rows.length}
        isLoading={false}
        onStateChange={() => undefined}
        getRowId={(row) => row.phaseId}
        renderControls={() => null}
      />
    </div>
  );
};
