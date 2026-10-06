import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CreateProgrammeTemplateInput } from '@ffp/core';

import { ContentPanel, PageContainer } from '@web/components/atoms';
import { StaticAlert, PageHeader } from '@web/components/molecules';
import { ComposableForm } from '@web/components/organisms';
import { toTemplateSaveError } from '@web/components/programme-templates';
import { useCreateTemplateMutation } from '@web/hooks/programme-templates';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';

import { CreateTemplateFormFields } from './CreateTemplateFormFields';

import type { CreateTemplateFormValues } from './types';

const DEFAULT_VALUES: CreateTemplateFormValues = {
  name: '',
  slug: '',
  description: '',
  difficulty: '',
};

export const TemplateCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();
  const createMutation = useCreateTemplateMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  const handleFormSubmit = useCallback(
    async (values: CreateTemplateFormValues): Promise<void> => {
      clearSubmitError();

      const payload: CreateProgrammeTemplateInput = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        difficulty: values.difficulty as CreateProgrammeTemplateInput['difficulty'],
        description: values.description.trim() || undefined,
      };

      await createMutation.mutateAsync(
        payload,
        saveCallbacks(
          (template) => `"${template.name}" created successfully`,
          (template) => {
            void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${template.publicId}`);
          },
          { mapError: toTemplateSaveError }
        )
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, navigate]
  );

  return (
    <PageContainer>
      <PageHeader title="Create Programme Template" />

      <ContentPanel>
        {submitError && <StaticAlert variant="error" message={submitError} className="mb-4" />}

        <ComposableForm<CreateTemplateFormValues>
          onSubmit={handleFormSubmit}
          defaultValues={DEFAULT_VALUES}
        >
          <CreateTemplateFormFields
            onCancel={handleNavigateBack}
            isSubmitting={createMutation.isPending}
          />
        </ComposableForm>
      </ContentPanel>
    </PageContainer>
  );
};
