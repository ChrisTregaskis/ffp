import React, { useCallback, useMemo } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import { Badge, Button, ContentPanel, PageContainer, Surface, Text } from '@web/components/atoms';
import {
  DescriptionPanel,
  EmptyState,
  ErrorRetryState,
  PageHeader,
  PageState,
} from '@web/components/molecules';
import { Table, createColumns } from '@web/components/organisms';
import type { RowAction } from '@web/components/organisms';
import {
  PHASE_STATUS_BADGES,
  PROGRAMME_STATUS_BADGES,
  ProgrammeKeyAreas,
} from '@web/components/programme';
import { RouteKey, routes } from '@web/config/routes';
import { useUserDetailQuery, useUserProgrammeQuery } from '@web/hooks/users';
import { isProgrammeLoadFailure } from '@web/utils/programme';

import { toMemberPhaseRow } from './phase-rows';

import type { MemberPhaseRow } from './phase-rows';

const columns = createColumns<MemberPhaseRow>();

export const MemberProgrammePage: React.FC = () => {
  const { id: publicId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: detail, isPending, error, refetch } = useUserProgrammeQuery(publicId);
  const { data: user } = useUserDetailQuery(publicId);

  const phaseRows = useMemo(() => (detail?.phases ?? []).map(toMemberPhaseRow), [detail]);

  // No-op — client-side table, data already loaded
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleStateChange = useCallback(() => {}, []);

  const handleBackToUsers = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_USERS].path);
  }, [navigate]);

  const handleViewSessions = useCallback(
    (row: MemberPhaseRow) => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_USER_PROGRAMME_PHASE].path, {
          id: publicId,
          phaseId: row.publicId,
        })
      );
    },
    [navigate, publicId]
  );

  const rowActions = useCallback(
    (): RowAction<MemberPhaseRow>[] => [{ label: 'View Sessions', onClick: handleViewSessions }],
    [handleViewSessions]
  );

  const phaseColumns = useMemo(
    () => [
      columns.number('phaseNumber', { label: 'Order', align: 'center' }),
      columns.text('name', { label: 'Phase' }),
      columns.text('status', {
        label: 'Status',
        cell: (_value, row) => <Badge {...PHASE_STATUS_BADGES[row.status]} />,
      }),
      columns.text('sessionCount', {
        label: 'Sessions done',
        align: 'center',
        cell: (_value, row) => `${String(row.sessionsDone)} / ${String(row.sessionCount)}`,
      }),
      columns.actions({ actions: rowActions }),
    ],
    [rowActions]
  );

  const memberName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <PageContainer>
      <PageHeader title={detail?.programme.name ?? 'Member Programme'} subtitle={memberName} />

      {isPending ? (
        <PageState isLoading />
      ) : !detail && isProgrammeLoadFailure(error) ? (
        <ErrorRetryState
          title="We couldn't load this programme just now."
          onRetry={() => void refetch()}
        />
      ) : !detail ? (
        <EmptyState
          message="This member doesn't have a programme yet."
          action={
            <Button variant="secondary" size="sm" onClick={handleBackToUsers}>
              Back to Users
            </Button>
          }
        />
      ) : (
        <>
          <ContentPanel>
            {detail.programme.description && (
              <DescriptionPanel description={detail.programme.description} />
            )}
            <Surface padding="lg" className="mb-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge {...PROGRAMME_STATUS_BADGES[detail.programme.status]} />
                {detail.level !== null && (
                  <Badge
                    label={`Level ${String(detail.level)}`}
                    variant="brand"
                    appearance="soft"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Text as="p" variant="eyebrow">
                  Key areas
                </Text>
                <ProgrammeKeyAreas keyAreas={detail.keyAreas} />
              </div>
            </Surface>
          </ContentPanel>

          <Table<MemberPhaseRow>
            tableId="member-programme-phases"
            data={phaseRows}
            columns={phaseColumns}
            totalRows={phaseRows.length}
            isLoading={false}
            onStateChange={handleStateChange}
            defaultPageSize={50}
            pageSizeOptions={[50]}
            getRowId={(row) => row.id}
          />
        </>
      )}
    </PageContainer>
  );
};
