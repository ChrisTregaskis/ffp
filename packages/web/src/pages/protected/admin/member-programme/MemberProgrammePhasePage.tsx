import React, { useCallback } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import { Button, ContentPanel, PageContainer } from '@web/components/atoms';
import {
  DescriptionPanel,
  EmptyState,
  ErrorRetryState,
  PageHeader,
  PageState,
} from '@web/components/molecules';
import { ProgrammeSessionCard } from '@web/components/programme';
import { RouteKey, routes } from '@web/config/routes';
import { useUserProgrammeQuery } from '@web/hooks/users';
import { isProgrammeLoadFailure } from '@web/utils/programme';

export const MemberProgrammePhasePage: React.FC = () => {
  const { id: publicId = '', phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();

  const { data: detail, isPending, error, refetch } = useUserProgrammeQuery(publicId);

  const phase = detail?.phases.find((item) => item.publicId === phaseId);
  const displayName = phase?.name ?? `Phase ${String(phase?.phaseNumber ?? '')}`;

  const handleBackToProgramme = useCallback(() => {
    void navigate(generatePath(routes[RouteKey.ADMIN_USER_PROGRAMME].path, { id: publicId }));
  }, [navigate, publicId]);

  const backButton = (
    <Button variant="secondary" size="sm" onClick={handleBackToProgramme}>
      Back to Programme
    </Button>
  );

  return (
    <PageContainer>
      <PageHeader
        title={phase ? `${displayName} — Sessions` : 'Programme Phase'}
        subtitle={detail?.programme.name}
      />

      {isPending ? (
        <PageState isLoading />
      ) : !detail && isProgrammeLoadFailure(error) ? (
        <ErrorRetryState
          title="We couldn't load this programme just now."
          onRetry={() => void refetch()}
        />
      ) : !phase ? (
        <EmptyState
          message={
            detail
              ? "This phase isn't part of the member's programme."
              : "This member doesn't have a programme yet."
          }
          action={backButton}
        />
      ) : (
        <ContentPanel>
          {phase.description && <DescriptionPanel description={phase.description} />}

          {phase.sessions.length === 0 ? (
            <EmptyState message="No sessions in this phase." />
          ) : (
            <div className="space-y-3">
              {phase.sessions.map((session) => (
                <ProgrammeSessionCard key={session.templateSessionId} session={session} />
              ))}
            </div>
          )}
        </ContentPanel>
      )}
    </PageContainer>
  );
};
