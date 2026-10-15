import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import { useDeactivateTemplateMutation, useUpdateTemplateMutation } from './useTemplateMutations';

interface NamedTemplate {
  id: string;
  publicId: string;
  name: string;
}

const describeTemplate = (template: NamedTemplate): string => `"${template.name}"`;

/** Deactivate-with-confirmation and activate for programme templates, with their toasts. */
export const useTemplateActivation = <
  TTarget extends NamedTemplate,
>(): ActivationActions<TTarget> => {
  const deactivateMutation = useDeactivateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();
  const { mutate: deactivateTemplate } = deactivateMutation;
  const { mutate: updateTemplate } = updateMutation;

  const deactivate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateTemplate({ id, publicId }, callbacks);
    },
    [deactivateTemplate]
  );

  const activate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      updateTemplate({ id, publicId, data: { isActive: true } }, callbacks);
    },
    [updateTemplate]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: updateMutation.isPending,
    describe: describeTemplate,
  });
};
