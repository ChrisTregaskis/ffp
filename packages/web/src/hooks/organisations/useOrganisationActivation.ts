import { useCallback } from 'react';

import { useActivationActions } from '@web/hooks/useActivationActions';
import type { ActivationActions, ActivationCallbacks } from '@web/hooks/useActivationActions';

import { useUpdateOrganisationMutation } from './useOrganisationMutations';

interface NamedOrganisation {
  id: string;
  publicId: string;
  name: string;
}

const describeOrganisation = (organisation: NamedOrganisation): string => `"${organisation.name}"`;

/** Deactivate-with-confirmation and activate for organisations, with their toasts. */
export const useOrganisationActivation = <
  TTarget extends NamedOrganisation,
>(): ActivationActions<TTarget> => {
  // Organisations have no deactivate endpoint, so both directions update the status. One
  // instance each keeps their pending flags and callbacks apart.
  const deactivateMutation = useUpdateOrganisationMutation();
  const activateMutation = useUpdateOrganisationMutation();
  const { mutate: deactivateOrganisation } = deactivateMutation;
  const { mutate: activateOrganisation } = activateMutation;

  const deactivate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      deactivateOrganisation({ id, publicId, data: { status: 'inactive' } }, callbacks);
    },
    [deactivateOrganisation]
  );

  const activate = useCallback(
    ({ id, publicId }: TTarget, callbacks: ActivationCallbacks): void => {
      activateOrganisation({ id, publicId, data: { status: 'active' } }, callbacks);
    },
    [activateOrganisation]
  );

  return useActivationActions<TTarget>({
    deactivate,
    isDeactivating: deactivateMutation.isPending,
    activate,
    isActivating: activateMutation.isPending,
    describe: describeOrganisation,
  });
};
