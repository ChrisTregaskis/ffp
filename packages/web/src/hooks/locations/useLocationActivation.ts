import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import { useUpdateLocationMutation } from './useLocationMutations';

interface NamedLocation {
  id: string;
  publicId: string;
  name: string;
}

const describeLocation = (location: NamedLocation): string => `"${location.name}"`;

/** Deactivate-with-confirmation and activate for locations, with their toasts. */
export const useLocationActivation = <
  TTarget extends NamedLocation,
>(): ActivationActions<TTarget> => {
  // Locations have no deactivate endpoint, so both directions update the status. One
  // instance each keeps their pending flags and callbacks apart.
  const deactivateMutation = useUpdateLocationMutation();
  const activateMutation = useUpdateLocationMutation();
  const { mutate: deactivateLocation } = deactivateMutation;
  const { mutate: activateLocation } = activateMutation;

  const deactivate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateLocation({ id, publicId, data: { status: 'inactive' } }, callbacks);
    },
    [deactivateLocation]
  );

  const activate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      activateLocation({ id, publicId, data: { status: 'active' } }, callbacks);
    },
    [activateLocation]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: activateMutation.isPending,
    describe: describeLocation,
  });
};
