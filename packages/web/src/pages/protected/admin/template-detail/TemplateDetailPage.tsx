import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateProgrammeTemplateInput } from '@ffp/core';

import { Surface, Text } from '@web/components/atoms';
import {
  DeactivateTemplateModal,
  TemplateMetadataFormFields,
  toTemplateSaveError,
} from '@web/components/programme-templates';
import type { TemplateMetadataFormValues } from '@web/components/programme-templates';
import { AdminEditPageShell } from '@web/components/templates';
import { useTemplateDetailQuery, useUpdateTemplateMutation } from '@web/hooks/programme-templates';
import { useConfirmBeforeSave } from '@web/hooks/useConfirmBeforeSave';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';
import { formatDate } from '@web/utils/format';

import { toTemplateFormValues, toUpdateTemplateInput } from './template-form-values';

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: template, isLoading, error } = useTemplateDetailQuery(id ?? '');
  const updateMutation = useUpdateTemplateMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  /** Execute the update mutation */
  const executeUpdate = useCallback(
    async (data: UpdateProgrammeTemplateInput): Promise<void> => {
      if (!template) {
        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: template.id, publicId: template.publicId, data },
        saveCallbacks('Template updated successfully', handleNavigateBack, {
          mapError: toTemplateSaveError,
        })
      );
    },
    [template, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  const deactivateConfirm = useConfirmBeforeSave(executeUpdate);
  const { requestConfirm: requestDeactivateConfirm } = deactivateConfirm;

  /** Handle form submission — taking the template out of use waits for confirmation */
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

      if (payload.isActive === false) {
        await requestDeactivateConfirm(payload);

        return;
      }

      await executeUpdate(payload);
    },
    [template, executeUpdate, requestDeactivateConfirm, handleNavigateBack]
  );

  return (
    <AdminEditPageShell
      title={template?.name ?? 'Template Detail'}
      resourceLabel="template"
      listLabel="Programme Templates"
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={template}
      toFormValues={toTemplateFormValues}
      onUpdate={handleUpdate}
      footer={
        <DeactivateTemplateModal
          isOpen={deactivateConfirm.isConfirmOpen}
          onClose={deactivateConfirm.cancel}
          onConfirm={deactivateConfirm.confirm}
          templateName={template?.name ?? ''}
        />
      }
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
            <Text
              as="span"
              styleProps={{ size: 'xs', weight: 'semibold' }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-white ${
                template.isActive ? 'bg-success' : 'bg-muted-foreground'
              }`}
            >
              {template.isActive ? 'Active' : 'Inactive'}
            </Text>
          </Surface>
        )
      }
    >
      <TemplateMetadataFormFields
        onCancel={handleNavigateBack}
        isSubmitting={updateMutation.isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
