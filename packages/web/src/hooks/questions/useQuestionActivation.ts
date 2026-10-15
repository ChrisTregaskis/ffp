import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import { useDeactivateQuestionMutation, useUpdateQuestionMutation } from './useQuestionMutations';

const describeQuestion = (): string => 'Question';

interface UseQuestionActivationOptions {
  /** Runs once a deactivation lands; the edit page navigates back */
  onDeactivated?: () => void;
}

/** Deactivate-with-confirmation and activate for questions, with their toasts. */
export const useQuestionActivation = <TTarget extends { publicId: string }>({
  onDeactivated,
}: UseQuestionActivationOptions = {}): ActivationActions<TTarget> => {
  const deactivateMutation = useDeactivateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();
  const { mutate: deactivateQuestion } = deactivateMutation;
  const { mutate: updateQuestion } = updateMutation;

  const deactivate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateQuestion(publicId, callbacks);
    },
    [deactivateQuestion]
  );

  const activate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      updateQuestion({ publicId, data: { isActive: true } }, callbacks);
    },
    [updateQuestion]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: updateMutation.isPending,
    describe: describeQuestion,
    onDeactivated,
  });
};
