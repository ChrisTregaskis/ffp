import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import { useDeactivateTagMutation, useUpdateTagMutation } from './useTagMutations';

const describeTag = (): string => 'Tag';

/** Deactivate-with-confirmation and reactivate for tags, with their toasts. */
export const useTagActivation = <
  TTarget extends { publicId: string },
>(): ActivationActions<TTarget> => {
  const deactivateMutation = useDeactivateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const { mutate: deactivateTag } = deactivateMutation;
  const { mutate: updateTag } = updateMutation;

  const deactivate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateTag(publicId, callbacks);
    },
    [deactivateTag]
  );

  const activate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      updateTag({ publicId, data: { isActive: true } }, callbacks);
    },
    [updateTag]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: updateMutation.isPending,
    describe: describeTag,
  });
};
