import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateProgrammeTemplateInput } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { TemplateMetadataFormFields } from '@web/components/form/templates';
import type { TemplateMetadataFormValues } from '@web/components/form/templates';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { Text } from '@web/components/text';
import { useTemplateDetailQuery, useUpdateTemplateMutation } from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';
import { formatDate } from '@web/utils/format';

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: template, isLoading, error } = useTemplateDetailQuery(id ?? '');
  const updateMutation = useUpdateTemplateMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Build default form values from template data */
  const defaultValues = useMemo((): TemplateMetadataFormValues | undefined => {
    if (!template) {
      return undefined;
    }

    return {
      name: template.name,
      slug: template.slug,
      description: template.description ?? '',
      difficulty: template.difficulty,
      isActive: String(template.isActive),
    };
  }, [template]);

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

  /** Execute the update mutation */
  const executeUpdate = useCallback(
    (data: UpdateProgrammeTemplateInput) => {
      if (!id) {
        return;
      }

      setSubmitError(null);

      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            addToast('Template updated successfully', { variant: 'success' });
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [id, updateMutation, addToast]
  );

  /** Handle form submission */
  const handleFormSubmit = useCallback(
    (values: TemplateMetadataFormValues) => {
      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        addToast('No changes to save', { variant: 'info' });

        return;
      }

      executeUpdate(payload);
    },
    [buildUpdatePayload, executeUpdate, addToast]
  );

  return (
    <PageContainer>
      <PageHeader title={template?.name ?? 'Template Detail'} />

      <ContentPanel>
        {(isLoading || error) && (
          <PageState
            isLoading={isLoading}
            title="Unable to load template"
            message={error?.message}
            actionLabel="Back to Programme Templates"
            onAction={handleNavigateBack}
          />
        )}

        {template && defaultValues && (
          <>
            {/* Template summary card */}
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
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
                  template.isActive ? 'bg-success' : 'bg-muted-foreground'
                }`}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <ComposableForm<TemplateMetadataFormValues>
              onSubmit={handleFormSubmit}
              defaultValues={defaultValues}
            >
              <TemplateMetadataFormFields
                onCancel={handleNavigateBack}
                isSubmitting={updateMutation.isPending}
                errorMessage={submitError}
              />
            </ComposableForm>
          </>
        )}
      </ContentPanel>
    </PageContainer>
  );
};
