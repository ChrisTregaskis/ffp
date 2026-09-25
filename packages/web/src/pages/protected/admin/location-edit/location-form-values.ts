import type { LocationDetailResponse } from '@ffp/core';

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
