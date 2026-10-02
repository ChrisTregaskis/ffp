import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  FlowDescriptionPanel,
  FlowStepCard,
  FlowStepForm,
  formValuesToStepInput,
} from '@web/components/assessment-flows';
import type { FlowStepFormValues } from '@web/components/assessment-flows';
import { Button } from '@web/components/button';
import { EmptyState } from '@web/components/feedback/EmptyState';
import { PageState } from '@web/components/feedback/PageState';
import { Icon, Icons } from '@web/components/Icon';
import { ContentPanel, InlineFormPanel, PageContainer, PageHeader } from '@web/components/layout';
import {
  useAssessmentFlowDetailQuery,
  useCreateFlowStepMutation,
  useDeleteFlowStepMutation,
  useReorderFlowStepsMutation,
  useUpdateFlowStepMutation,
} from '@web/hooks/assessment-flows';
import { useTemplateNameMap } from '@web/hooks/assessment-templates';
import { useToast } from '@web/hooks/useToast';
import { ApiError } from '@web/lib/api/client';
import { RouteKey, routes } from '@web/pages/routes';
import { flowStepsBranch, stepSharesOrder } from '@web/utils/flow-branching';
import { swapAdjacentItem } from '@web/utils/reorder';

import { BranchingNotice } from './BranchingNotice';

const REORDER_REFUSED_MESSAGE =
  'This flow sends members down different paths, so its steps have a set position and could not be moved.';

export const AssessmentFlowStepsPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const flowPublicId = publicId ?? '';

  const { data: flow, isLoading, error } = useAssessmentFlowDetailQuery(flowPublicId);
  const { templateNames } = useTemplateNameMap();

  const createStep = useCreateFlowStepMutation(flowPublicId);
  const updateStep = useUpdateFlowStepMutation(flowPublicId);
  const deleteStep = useDeleteFlowStepMutation(flowPublicId);
  const reorderSteps = useReorderFlowStepsMutation(flowPublicId);

  const isMutating =
    createStep.isPending || updateStep.isPending || deleteStep.isPending || reorderSteps.isPending;

  const [isAddingStep, setIsAddingStep] = useState(false);

  const steps = useMemo(() => flow?.steps ?? [], [flow?.steps]);
  const flowBranches = useMemo(() => flowStepsBranch(steps), [steps]);

  const handleNavigateToFlows = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENTS].path);
  }, [navigate]);

  const handleCreateStep = useCallback(
    (values: FlowStepFormValues): void => {
      createStep.mutate(formValuesToStepInput(values), {
        onSuccess: () => {
          addToast('Step added', { variant: 'success' });
          setIsAddingStep(false);
        },
        onError: (err) => addToast(err.message, { variant: 'error' }),
      });
    },
    [createStep, addToast]
  );

  const handleUpdateStep = useCallback(
    (stepPublicId: string, values: FlowStepFormValues): void => {
      updateStep.mutate(
        { stepPublicId, data: formValuesToStepInput(values) },
        {
          onSuccess: () => addToast('Step updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [updateStep, addToast]
  );

  const handleDeleteStep = useCallback(
    (stepPublicId: string): void => {
      deleteStep.mutate(
        { stepPublicId },
        {
          onSuccess: () => addToast('Step removed', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [deleteStep, addToast]
  );

  const handleReorder = useCallback(
    (stepPublicId: string, direction: 'up' | 'down'): void => {
      const orderedStepPublicIds = swapAdjacentItem(
        steps.map((step) => step.publicId),
        stepPublicId,
        direction
      );

      if (!orderedStepPublicIds) {
        return;
      }

      reorderSteps.mutate(
        { orderedStepPublicIds },
        {
          onSuccess: () => addToast('Step order updated', { variant: 'success' }),
          onError: (err) => {
            // A 409 means the flow branches after all — nothing the author did
            const refused = ApiError.isApiError(err) && err.status === 409;

            addToast(refused ? REORDER_REFUSED_MESSAGE : err.message, {
              variant: refused ? 'info' : 'error',
            });
          },
        }
      );
    },
    [steps, reorderSteps, addToast]
  );

  const handleStartAdding = useCallback((): void => {
    setIsAddingStep(true);
  }, []);

  const handleCancelAdding = useCallback((): void => {
    setIsAddingStep(false);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title={flow ? `${flow.name} — Steps` : 'Flow Steps'}
        subtitle="Arrange the steps a member moves through"
        actions={
          flow && (
            <Button
              variant="primary"
              icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
              onClick={handleStartAdding}
              disabled={isMutating || isAddingStep}
            >
              Add Step
            </Button>
          )
        }
      />

      {(isLoading || error) && (
        <PageState
          isLoading={isLoading}
          title="Unable to load flow"
          message={error?.message ?? 'This assessment flow could not be found.'}
          actionLabel="Back to Assessment Flows"
          onAction={handleNavigateToFlows}
        />
      )}

      {flow && (
        <ContentPanel>
          {flow.description && <FlowDescriptionPanel description={flow.description} />}

          {flowBranches && <BranchingNotice />}

          {isAddingStep && (
            <InlineFormPanel title="New Step">
              <FlowStepForm
                onSubmit={handleCreateStep}
                onCancel={handleCancelAdding}
                isSubmitting={createStep.isPending}
                submitLabel="Add Step"
              />
            </InlineFormPanel>
          )}

          {steps.length === 0 && !isAddingStep ? (
            <EmptyState
              message="No steps yet. Add the first step to start shaping this flow."
              action={
                <Button variant="secondary" size="sm" onClick={handleStartAdding}>
                  + Add Step
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <FlowStepCard
                  key={step.publicId}
                  step={step}
                  templateName={step.templateId ? templateNames.get(step.templateId) : undefined}
                  sharesPosition={stepSharesOrder(step, steps)}
                  reorderDisabled={flowBranches}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                  onUpdate={handleUpdateStep}
                  onDelete={handleDeleteStep}
                  onMoveUp={(id) => {
                    handleReorder(id, 'up');
                  }}
                  onMoveDown={(id) => {
                    handleReorder(id, 'down');
                  }}
                  isMutating={isMutating}
                />
              ))}
            </div>
          )}
        </ContentPanel>
      )}
    </PageContainer>
  );
};
