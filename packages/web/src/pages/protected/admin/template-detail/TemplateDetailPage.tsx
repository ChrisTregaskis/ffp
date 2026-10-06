import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateProgrammeTemplateInput } from '@ffp/core';

import { Text } from '@web/components/atoms';
import {
  TemplateMetadataFormFields,
  toTemplateSaveError,
} from '@web/components/programme-templates';
import type { TemplateMetadataFormValues } from '@web/components/programme-templates';
import { AdminEditPageShell } from '@web/components/templates';
import { useTemplateDetailQuery, useUpdateTemplateMutation } from '@web/hooks/programme-templates';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';
import { formatDate } from '@web/utils/format';

import { toTemplateFormValues } from './template-form-values';

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const { data: template, isLoading, error } = useTemplateDetailQuery(id ?? '');
  const updateMutation = useUpdateTemplateMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  /** Build update payload — only include changed fields */
  const buildUpdatePayload = useCallback(
    (values: TemplateMetadataFormValues): UpdateProgrammeTemplateInput => {
      const payload: UpdateProgrammeTemplateInput = {};

      if (!template) {
        return payload;
      }

      if (values.name !== template.name) {
        payload.name = values.name;
      }

      if (values.slug !== template.slug) {
        payload.slug = values.slug;
      }

      const descValue = values.description || null;

      if (descValue !== (template.description ?? null)) {
        payload.description = descValue;
      }

      if (values.difficulty !== template.difficulty) {
        payload.difficulty = values.difficulty as UpdateProgrammeTemplateInput['difficulty'];
      }

      const newIsActive = values.isActive === 'true';

      if (newIsActive !== template.isActive) {
        payload.isActive = newIsActive;
      }

      return payload;
    },
    [template]
  );

  const handleUpdate = useCallback(
    async (values: TemplateMetadataFormValues): Promise<void> => {
      if (!template) {
        return;
      }

      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: template.id, publicId: template.publicId, data: payload },
        saveCallbacks('Template updated successfully', handleNavigateBack, {
          mapError: toTemplateSaveError,
        })
      );
    },
    [
      template,
      buildUpdatePayload,
      clearSubmitError,
      updateMutation,
      saveCallbacks,
      handleNavigateBack,
    ]
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
      beforeForm={
        template && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-white px-5 py-4">
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
          </div>
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
