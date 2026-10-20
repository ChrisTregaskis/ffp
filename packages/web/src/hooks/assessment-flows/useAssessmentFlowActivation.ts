import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import {
  useDeactivateAssessmentFlowMutation,
  useUpdateAssessmentFlowMutation,
} from './useAssessmentFlowMutations';

interface NamedFlow {
  publicId: string;
  name: string;
}

const describeFlow = (flow: NamedFlow): string => `"${flow.name}"`;

interface UseAssessmentFlowActivationOptions {
  /** Runs once a deactivation lands; the edit page navigates back */
  onDeactivated?: () => void;
}

/** Deactivate-with-confirmation and activate for assessment flows, with their toasts. */
export const useAssessmentFlowActivation = <TTarget extends NamedFlow>({
  onDeactivated,
}: UseAssessmentFlowActivationOptions = {}): ActivationActions<TTarget> => {
  const deactivateMutation = useDeactivateAssessmentFlowMutation();
  const updateMutation = useUpdateAssessmentFlowMutation();
  const { mutate: deactivateFlow } = deactivateMutation;
  const { mutate: updateFlow } = updateMutation;

  const deactivate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateFlow(publicId, callbacks);
    },
    [deactivateFlow]
  );

  const activate = useCallback(
    ({ publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      updateFlow({ publicId, data: { isActive: true } }, callbacks);
    },
    [updateFlow]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: updateMutation.isPending,
    describe: describeFlow,
    onDeactivated,
  });
};
