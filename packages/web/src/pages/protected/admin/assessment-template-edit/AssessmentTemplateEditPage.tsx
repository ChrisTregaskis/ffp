import React, { useCallback } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import type { UpdateAssessmentTemplateInput } from '@ffp/core';

import {
  DeactivateAssessmentTemplateModal,
  TemplateQuestionsPanel,
} from '@web/components/assessment-templates';
import { ActivationToggleButton } from '@web/components/molecules';
import { AdminEditPageShell } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import {
  useAssessmentTemplateActivation,
  useAssessmentTemplateDetailQuery,
  useCreateAssessmentTemplateMutation,
  useUpdateAssessmentTemplateMutation,
} from '@web/hooks/assessment-templates';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import type { AdminAssessmentTemplateDetail } from '@web/lib/api/endpoints';

import {
  EMPTY_ASSESSMENT_TEMPLATE_VALUES,
  toAssessmentTemplateFormValues,
} from './assessment-template-form-values';
import { AssessmentTemplateFormFields } from './AssessmentTemplateFormFields';

import type { AssessmentTemplateFormValues } from './types';

export const AssessmentTemplateEditPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!publicId;

  const {
    data: template,
    isLoading,
    error,
  } = useAssessmentTemplateDetailQuery(publicId ?? '', { enabled: isEditMode });

  const createMutation = useCreateAssessmentTemplateMutation();
  const updateMutation = useUpdateAssessmentTemplateMutation();

  const handleNavigateBack = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENT_TEMPLATES].path);
  }, [navigate]);

  const activation = useAssessmentTemplateActivation<AdminAssessmentTemplateDetail>({
    onDeactivated: handleNavigateBack,
  });

  const handleCreate = useCallback(
    async (values: AssessmentTemplateFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        {
          name: values.name.trim(),
          description: values.description.trim() || null,
          isActive: true,
        },
        saveCallbacks(
          (created) => `"${created.name}" created successfully`,
          (created) => {
            // Questions are assigned on the edit page, so the author lands there next
            void navigate(
              generatePath(routes[RouteKey.ADMIN_ASSESSMENT_TEMPLATE_EDIT].path, {
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
    async (values: AssessmentTemplateFormValues): Promise<void> => {
      if (!publicId) {
        return;
      }

      clearSubmitError();

      // An emptied description is sent as null so the stored value is cleared
      const payload: UpdateAssessmentTemplateInput = {
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const headerActions =
    isEditMode && template ? (
      <ActivationToggleButton
        isActive={template.isActive}
        onDeactivate={() => {
          activation.requestDeactivate(template);
        }}
        onActivate={() => {
          activation.activate(template);
        }}
        isActivating={activation.isActivating}
      />
    ) : undefined;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit Assessment Template' : 'Create Assessment Template'}
      subtitle={
        isEditMode
          ? 'Update the template and the questions it asks'
          : 'Name the template — its questions are added once it exists'
      }
      headerActions={headerActions}
      resourceLabel="template"
      listLabel="Assessment Templates"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      loadErrorMessage={error?.message ?? 'This assessment template could not be found.'}
      onBack={handleNavigateBack}
      record={template}
      emptyValues={EMPTY_ASSESSMENT_TEMPLATE_VALUES}
      toFormValues={toAssessmentTemplateFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      footer={
        <>
          {template && <TemplateQuestionsPanel template={template} />}
          <DeactivateAssessmentTemplateModal
            isOpen={!!activation.pending}
            onClose={activation.cancelDeactivate}
            onConfirm={activation.confirmDeactivate}
            isLoading={activation.isDeactivating}
            templateName={template?.name ?? ''}
          />
        </>
      }
    >
      <AssessmentTemplateFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isSaving}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
