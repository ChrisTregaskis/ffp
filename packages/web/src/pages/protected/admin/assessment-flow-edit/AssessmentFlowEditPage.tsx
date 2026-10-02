import React, { useCallback } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import type { AssessmentFlowWithStepsView, UpdateAssessmentFlowInput } from '@ffp/core';

import { Button } from '@web/components/button';
import { AdminEditPageShell } from '@web/components/layout';
import { DeactivateAssessmentFlowModal } from '@web/components/modal';
import {
  useAssessmentFlowActivation,
  useAssessmentFlowDetailQuery,
  useCreateAssessmentFlowMutation,
  useUpdateAssessmentFlowMutation,
} from '@web/hooks/assessment-flows';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';

import {
  EMPTY_ASSESSMENT_FLOW_VALUES,
  toAssessmentFlowFormValues,
} from './assessment-flow-form-values';
import { AssessmentFlowFormFields } from './AssessmentFlowFormFields';

import type { AssessmentFlowFormValues } from './types';

export const AssessmentFlowEditPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!publicId;

  const {
    data: flow,
    isLoading,
    error,
  } = useAssessmentFlowDetailQuery(publicId ?? '', { enabled: isEditMode });

  const createMutation = useCreateAssessmentFlowMutation();
  const updateMutation = useUpdateAssessmentFlowMutation();

  const handleNavigateBack = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENTS].path);
  }, [navigate]);

  const activation = useAssessmentFlowActivation<AssessmentFlowWithStepsView>({
    onDeactivated: handleNavigateBack,
  });

  const handleNavigateToSteps = useCallback((): void => {
    if (!publicId) {
      return;
    }

    void navigate(generatePath(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS].path, { publicId }));
  }, [navigate, publicId]);

  const handleNavigateToPreview = useCallback((): void => {
    if (!publicId) {
      return;
    }

    void navigate(generatePath(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_PREVIEW].path, { publicId }));
  }, [navigate, publicId]);

  const handleCreate = useCallback(
    async (values: AssessmentFlowFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          isActive: true,
        },
        saveCallbacks(
          (created) => `"${created.name}" created successfully`,
          (created) => {
            void navigate(
              generatePath(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT].path, {
                publicId: created.publicId,
              })
            );
          }
        )
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, navigate]
  );

  const handleUpdate = useCallback(
    async (values: AssessmentFlowFormValues): Promise<void> => {
      if (!publicId) {
        return;
      }

      clearSubmitError();

      // An emptied description is sent as null so the stored value is cleared
      const payload: UpdateAssessmentFlowInput = {
        name: values.name.trim(),
        description: values.description.trim() || null,
      };

      await updateMutation.mutateAsync(
        { publicId, data: payload },
        saveCallbacks((updated) => `"${updated.name}" updated successfully`, handleNavigateBack)
      );
    },
    [publicId, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const headerActions =
    isEditMode && flow ? (
      <>
        <Button variant="secondary" onClick={handleNavigateToPreview}>
          Preview
        </Button>
        <Button variant="secondary" onClick={handleNavigateToSteps}>
          Edit Steps
        </Button>
        {flow.isActive ? (
          <Button
            variant="destructive"
            onClick={() => {
              activation.requestDeactivate(flow);
            }}
          >
            Deactivate
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              activation.activate(flow);
            }}
            loading={activation.isActivating}
          >
            Reactivate
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit Assessment Flow' : 'Create Assessment Flow'}
      subtitle={
        isEditMode
          ? 'Update how this flow is named and described'
          : 'Name the flow — its steps are added once it exists'
      }
      headerActions={headerActions}
      resourceLabel="flow"
      listLabel="Assessment Flows"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      loadErrorMessage={error?.message ?? 'This assessment flow could not be found.'}
      onBack={handleNavigateBack}
      record={flow}
      emptyValues={EMPTY_ASSESSMENT_FLOW_VALUES}
      toFormValues={toAssessmentFlowFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      footer={
        <DeactivateAssessmentFlowModal
          isOpen={!!activation.pending}
          onClose={activation.cancelDeactivate}
          onConfirm={activation.confirmDeactivate}
          isLoading={activation.isDeactivating}
          flowName={flow?.name ?? ''}
        />
      }
    >
      <AssessmentFlowFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
