import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateAssessmentFlowInput } from '@ffp/core';

import { Button } from '@web/components/button';
import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { DeactivateAssessmentFlowModal } from '@web/components/modal';
import {
  useAssessmentFlowDetailQuery,
  useCreateAssessmentFlowMutation,
  useDeactivateAssessmentFlowMutation,
  useUpdateAssessmentFlowMutation,
} from '@web/hooks/assessment-flows';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { AssessmentFlowFormFields } from './AssessmentFlowFormFields';

import type { AssessmentFlowFormValues } from './types';

const EMPTY_VALUES: AssessmentFlowFormValues = { name: '', description: '' };

export const AssessmentFlowEditPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditMode = !!publicId;

  const {
    data: flow,
    isLoading,
    error,
  } = useAssessmentFlowDetailQuery(publicId ?? '', { enabled: isEditMode });

  const createMutation = useCreateAssessmentFlowMutation();
  const updateMutation = useUpdateAssessmentFlowMutation();
  const deactivateMutation = useDeactivateAssessmentFlowMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const defaultValues = useMemo((): AssessmentFlowFormValues => {
    if (!isEditMode || !flow) {
      return EMPTY_VALUES;
    }

    return { name: flow.name, description: flow.description ?? '' };
  }, [isEditMode, flow]);

  const handleNavigateBack = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENTS].path);
  }, [navigate]);

  const handleNavigateToSteps = useCallback((): void => {
    if (!publicId) {
      return;
    }

    void navigate(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS].path.replace(':publicId', publicId));
  }, [navigate, publicId]);

  const handleCreate = useCallback(
    (values: AssessmentFlowFormValues): void => {
      setSubmitError(null);

      createMutation.mutate(
        {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          isActive: true,
        },
        {
          onSuccess: (created) => {
            addToast(`"${created.name}" created successfully`, { variant: 'success' });
            void navigate(
              routes[RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT].path.replace(
                ':publicId',
                created.publicId
              )
            );
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [createMutation, addToast, navigate]
  );

  const handleUpdate = useCallback(
    (values: AssessmentFlowFormValues): void => {
      if (!publicId) {
        return;
      }

      setSubmitError(null);

      // An emptied description is sent as null so the stored value is cleared
      const payload: UpdateAssessmentFlowInput = {
        name: values.name.trim(),
        description: values.description.trim() || null,
      };

      updateMutation.mutate(
        { publicId, data: payload },
        {
          onSuccess: (updated) => {
            addToast(`"${updated.name}" updated successfully`, { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [publicId, updateMutation, addToast, handleNavigateBack]
  );

  const handleFormSubmit = useCallback(
    (values: AssessmentFlowFormValues): void => {
      if (isEditMode) {
        handleUpdate(values);
      } else {
        handleCreate(values);
      }
    },
    [isEditMode, handleUpdate, handleCreate]
  );

  const handleOpenDeactivateModal = useCallback((): void => {
    setIsDeactivateModalOpen(true);
  }, []);

  const handleCloseDeactivateModal = useCallback((): void => {
    setIsDeactivateModalOpen(false);
  }, []);

  const handleConfirmDeactivate = useCallback((): void => {
    if (!publicId) {
      return;
    }

    deactivateMutation.mutate(publicId, {
      onSuccess: () => {
        addToast(`"${flow?.name ?? 'Flow'}" deactivated successfully`, { variant: 'success' });
        setIsDeactivateModalOpen(false);
        handleNavigateBack();
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setIsDeactivateModalOpen(false);
      },
    });
  }, [publicId, deactivateMutation, addToast, flow?.name, handleNavigateBack]);

  const handleReactivate = useCallback((): void => {
    if (!publicId) {
      return;
    }

    updateMutation.mutate(
      { publicId, data: { isActive: true } },
      {
        onSuccess: (updated) => {
          addToast(`"${updated.name}" reactivated successfully`, { variant: 'success' });
        },
        onError: (err) => {
          addToast(err.message, { variant: 'error' });
        },
      }
    );
  }, [publicId, updateMutation, addToast]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoadingOrError = isEditMode && (isLoading || !!error);

  const headerActions =
    isEditMode && flow ? (
      <>
        <Button variant="secondary" onClick={handleNavigateToSteps}>
          Edit Steps
        </Button>
        {flow.isActive ? (
          <Button variant="destructive" onClick={handleOpenDeactivateModal}>
            Deactivate
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleReactivate} loading={updateMutation.isPending}>
            Reactivate
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <PageContainer>
      <PageHeader
        title={isEditMode ? 'Edit Assessment Flow' : 'Create Assessment Flow'}
        subtitle={
          isEditMode
            ? 'Update how this flow is named and described'
            : 'Name the flow — its steps are added once it exists'
        }
        actions={headerActions}
      />

      <ContentPanel>
        {isLoadingOrError ? (
          <PageState
            isLoading={isLoading}
            title="Unable to load flow"
            message={error?.message ?? 'This assessment flow could not be found.'}
            actionLabel="Back to Assessment Flows"
            onAction={handleNavigateBack}
          />
        ) : (
          <ComposableForm<AssessmentFlowFormValues>
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
          >
            <AssessmentFlowFormFields
              isEditMode={isEditMode}
              onCancel={handleNavigateBack}
              isSubmitting={isPending}
              errorMessage={submitError}
            />
          </ComposableForm>
        )}
      </ContentPanel>

      <DeactivateAssessmentFlowModal
        isOpen={isDeactivateModalOpen}
        onClose={handleCloseDeactivateModal}
        onConfirm={handleConfirmDeactivate}
        isLoading={deactivateMutation.isPending}
        flowName={flow?.name ?? ''}
      />
    </PageContainer>
  );
};
