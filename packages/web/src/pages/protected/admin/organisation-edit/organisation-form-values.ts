import type { OrganisationDetailResponse } from '@ffp/core';

import type { OrganisationFormValues } from './types';

export const EMPTY_ORGANISATION_VALUES: OrganisationFormValues = {
  organisationName: '',
  status: 'active',
};

export const toOrganisationFormValues = (
  organisation: OrganisationDetailResponse
): OrganisationFormValues => ({
  organisationName: organisation.name,
  status: organisation.status,
});
