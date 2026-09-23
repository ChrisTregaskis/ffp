import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FlowDescriptionPanel } from '@web/components/assessment-flows';
import { EmptyState } from '@web/components/feedback/EmptyState';
import { PageState } from '@web/components/feedback/PageState';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { useAssessmentFlowDetailQuery } from '@web/hooks/assessment-flows';
import { useTemplateNameMap } from '@web/hooks/assessment-templates';
import { useDismissibleNotice } from '@web/hooks/useDismissibleNotice';
import { RouteKey, routes } from '@web/pages/routes';
import { flowStepsBranch, stepSharesOrder } from '@web/utils/flow-branching';

import { FlowPreviewStepCard } from './FlowPreviewStepCard';

const BRANCHING_MESSAGE =
  'This flow sends members down different paths depending on their answers, so some steps share a position and not everyone sees every step.';

/** Its own id — dismissing the steps page's notice should not hide this one. */
const BRANCHING_NOTICE_ID = 'assessment-flow-branching-preview';

/** Read-only view of a whole flow, so its shape can be checked in one place. */
export const AssessmentFlowPreviewPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();

  const { data: flow, isLoading, error } = useAssessmentFlowDetailQuery(publicId ?? '');
  // Step detail renders open here, so an unresolved template name would read as
  // an unconfigured step
  const { templateNames, isPending: templateNamesPending } = useTemplateNameMap();
  const { isDismissed, dismiss } = useDismissibleNotice(BRANCHING_NOTICE_ID);

  const steps = useMemo(() => flow?.steps ?? [], [flow?.steps]);
  const flowBranches = useMemo(() => flowStepsBranch(steps), [steps]);

  const handleNavigateToFlows = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENTS].path);
  }, [navigate]);

  return (
    <PageContainer>
      <PageHeader
        title={flow ? `${flow.name} — Preview` : 'Flow Preview'}
        subtitle="The steps a member moves through, in order"
      />

      {(isLoading || templateNamesPending || error) && (
        <PageState
          isLoading={(isLoading || templateNamesPending) && !error}
          title="Unable to load flow"
          message={error?.message ?? 'This assessment flow could not be found.'}
          actionLabel="Back to Assessment Flows"
          onAction={handleNavigateToFlows}
        />
      )}

      {/* A failed background refetch leaves `flow` populated, so `error` gates the
          content too rather than rendering a stale flow under an error card */}
      {flow && !error && !templateNamesPending && (
        <ContentPanel>
          {flow.description && <FlowDescriptionPanel description={flow.description} />}

          {flowBranches && !isDismissed && (
            <StaticAlert
              variant="info"
              appearance="soft"
              message={BRANCHING_MESSAGE}
              onDismiss={dismiss}
              className="mb-4"
            />
          )}

          {steps.length === 0 ? (
            <EmptyState message="This flow has no steps yet, so there is nothing to preview." />
          ) : (
            <div className="space-y-3">
              {steps.map((step) => (
                <FlowPreviewStepCard
                  key={step.publicId}
                  step={step}
                  templateName={step.templateId ? templateNames.get(step.templateId) : undefined}
                  sharesPosition={stepSharesOrder(step, steps)}
                />
              ))}
            </div>
          )}
        </ContentPanel>
      )}
    </PageContainer>
  );
};
