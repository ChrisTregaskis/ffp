import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import {
  useDeactivateAssessmentTemplateMutation,
  useUpdateAssessmentTemplateMutation,
} from './useAssessmentTemplateMutations';

interface NamedTemplate {
  publicId: string;
  name: string;
}

const describeTemplate = (template: NamedTemplate): string => `"${template.name}"`;

interface UseAssessmentTemplateActivationOptions {
  /** Runs once a deactivation lands; the edit page navigates back */
  onDeactivated?: () => void;
}

/** Deactivate-with-confirmation and activate for assessment templates, with their toasts. */
export const useAssessmentTemplateActivation = <TTarget extends NamedTemplate>({
  onDeactivated,
}: UseAssessmentTemplateActivationOptions = {}): ActivationActions<TTarget> => {
  const deactivateMutation = useDeactivateAssessmentTemplateMutation();
  const updateMutation = useUpdateAssessmentTemplateMutation();
  const { mutate: deactivateTemplate } = deactivateMutation;
  const { mutate: updateTemplate } = updateMutation;

  const deactivate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateTemplate(publicId, callbacks);
    },
    [deactivateTemplate]
  );

  const activate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      updateTemplate({ publicId, data: { isActive: true } }, callbacks);
    },
    [updateTemplate]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: updateMutation.isPending,
    describe: describeTemplate,
    onDeactivated,
  });
};
