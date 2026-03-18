import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CreateProgrammeTemplateInput } from '@ffp/core';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { useCreateTemplateMutation } from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { ApiError } from '@web/lib/api';
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
  const { addToast } = useToast();
  const createMutation = useCreateTemplateMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  const handleFormSubmit = useCallback(
    (values: CreateTemplateFormValues) => {
      setSubmitError(null);

      const payload: CreateProgrammeTemplateInput = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        difficulty: values.difficulty as CreateProgrammeTemplateInput['difficulty'],
        description: values.description.trim() || undefined,
      };

      createMutation.mutate(payload, {
        onSuccess: (template) => {
          addToast(`"${template.name}" created successfully`, { variant: 'success' });
          void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${template.id}`);
        },
        onError: (err) => {
          if (ApiError.isApiError(err) && err.status === 409) {
            setSubmitError(
              'A template with this slug already exists. Please use a different slug.'
            );
          } else {
            setSubmitError(err.message);
          }
        },
      });
    },
    [createMutation, navigate, addToast]
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
