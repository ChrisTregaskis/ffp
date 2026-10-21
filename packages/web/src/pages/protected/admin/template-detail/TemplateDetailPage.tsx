import React, { useCallback } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import { Badge, Surface, Text } from '@web/components/atoms';
import {
  DeactivateTemplateModal,
  TemplateMetadataFormFields,
} from '@web/components/programme-templates';
import type { TemplateMetadataFormValues } from '@web/components/programme-templates';
import { AdminEditPageShell } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import {
  useCreateTemplateMutation,
  useTemplateDetailQuery,
  useUpdateTemplateMutation,
} from '@web/hooks/programme-templates';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { formatDate } from '@web/utils/format';

import {
  deactivatesTemplate,
  EMPTY_TEMPLATE_VALUES,
  toCreateTemplateInput,
  toTemplateFormValues,
  toUpdateTemplateInput,
} from './template-form-values';

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!id;

  const {
    data: template,
    isLoading,
    error,
  } = useTemplateDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  /** Handle create submission; lands on the new template */
  const handleCreate = useCallback(
    async (values: TemplateMetadataFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        toCreateTemplateInput(values),
        saveCallbacks(
          (created) => `"${created.name}" created successfully`,
          (created) => {
            void navigate(
              generatePath(routes[RouteKey.ADMIN_TEMPLATE_DETAIL].path, { id: created.publicId })
            );
          }
        )
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, navigate]
  );

  /** Handle edit submission; taking the template out of use waits for the shell's confirm */
  const handleUpdate = useCallback(
    async (values: TemplateMetadataFormValues): Promise<void> => {
      if (!template) {
        return;
      }

      const payload = toUpdateTemplateInput(values, template);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: template.id, publicId: template.publicId, data: payload },
        saveCallbacks('Template updated successfully', handleNavigateBack)
      );
    },
    [template, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminEditPageShell
      title={isEditMode ? (template?.name ?? 'Template Detail') : 'Create Programme Template'}
      resourceLabel="template"
      listLabel="Programme Templates"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={template}
      emptyValues={EMPTY_TEMPLATE_VALUES}
      toFormValues={toTemplateFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      confirmBeforeSave={{
        when: deactivatesTemplate,
        renderModal: (modalProps) => (
          <DeactivateTemplateModal {...modalProps} templateName={template?.name ?? ''} />
        ),
      }}
      beforeForm={
        template && (
          <Surface padding="bar" className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Created:</Text>
                <Text styleProps={{ size: 'sm', weight: 'medium' }}>
                  {formatDate(template.createdAt)}
                </Text>
              </div>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Last updated:</Text>
                <Text styleProps={{ size: 'sm', weight: 'medium' }}>
                  {formatDate(template.updatedAt)}
                </Text>
              </div>
            </div>
            <Badge
              label={template.isActive ? 'Active' : 'Inactive'}
              variant={template.isActive ? 'success' : 'muted'}
              appearance="solid"
              size="sm"
            />
          </Surface>
        )
      }
    >
      <TemplateMetadataFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
