import type { OrganisationDetailResponse, UpdateOrganisationInput } from '@ffp/core';

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

/** Only the fields that differ from the stored organisation; an empty object means nothing changed. */
export const toUpdateOrganisationInput = (
  values: OrganisationFormValues,
  organisation: OrganisationDetailResponse
): UpdateOrganisationInput => {
  const payload: UpdateOrganisationInput = {};

  if (values.organisationName !== organisation.name) {
    payload.name = values.organisationName;
  }

  if (values.status !== organisation.status) {
    payload.status = values.status as UpdateOrganisationInput['status'];
  }

  return payload;
};

/** An edit that takes the organisation out of use, which the page confirms before saving */
export const deactivatesOrganisation = (
  values: OrganisationFormValues,
  organisation: OrganisationDetailResponse
): boolean => toUpdateOrganisationInput(values, organisation).status === 'inactive';
