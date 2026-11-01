import type { LocationDetailResponse, UpdateLocationInput } from '@ffp/core';

import type { LocationFormValues } from './types';

export const EMPTY_LOCATION_VALUES: LocationFormValues = {
  locationName: '',
  organisationId: '',
  organisationDisplay: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: '',
  status: 'active',
};

export const toLocationFormValues = (location: LocationDetailResponse): LocationFormValues => ({
  locationName: location.name,
  organisationId: location.organisationId,
  organisationDisplay: location.organisationName,
  addressLine1: location.address?.line1 ?? '',
  addressLine2: location.address?.line2 ?? '',
  city: location.address?.city ?? '',
  county: location.address?.county ?? '',
  postcode: location.address?.postcode ?? '',
  country: location.address?.country ?? '',
  status: location.status,
});

/** The address from the form, or null when every field is blank so the stored one is cleared. */
const toAddress = (values: LocationFormValues): UpdateLocationInput['address'] => {
  const address = {
    line1: values.addressLine1 || undefined,
    line2: values.addressLine2 || undefined,
    city: values.city || undefined,
    county: values.county || undefined,
    postcode: values.postcode || undefined,
    country: values.country || undefined,
  };

  const hasValues = Object.values(address).some((v) => v !== undefined);

  return hasValues ? address : null;
};

/** Only the fields that differ from the stored location; an empty object means nothing changed. */
export const toUpdateLocationInput = (
  values: LocationFormValues,
  location: LocationDetailResponse
): UpdateLocationInput => {
  const payload: UpdateLocationInput = {};

  if (values.locationName !== location.name) {
    payload.name = values.locationName;
  }

  if (values.status !== location.status) {
    payload.status = values.status as UpdateLocationInput['status'];
  }

  const currentAddress = location.address;
  const addressChanged =
    (values.addressLine1 || '') !== (currentAddress?.line1 ?? '') ||
    (values.addressLine2 || '') !== (currentAddress?.line2 ?? '') ||
    (values.city || '') !== (currentAddress?.city ?? '') ||
    (values.county || '') !== (currentAddress?.county ?? '') ||
    (values.postcode || '') !== (currentAddress?.postcode ?? '') ||
    (values.country || '') !== (currentAddress?.country ?? '');

  if (addressChanged) {
    payload.address = toAddress(values);
  }

  return payload;
};

/** An edit that takes the location out of use, which the page confirms before saving */
export const deactivatesLocation = (
  values: LocationFormValues,
  location: LocationDetailResponse
): boolean => toUpdateLocationInput(values, location).status === 'inactive';
