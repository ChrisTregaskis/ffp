import type { UserDetailResponse } from '@ffp/core';

import type { UserFormValues } from './types';

export const EMPTY_USER_VALUES: UserFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  locationId: '',
  locationDisplay: '',
  phone: '',
  dateOfBirth: '',
};

export const toUserFormValues = (user: UserDetailResponse): UserFormValues => ({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  locationId: user.locationId ?? '',
  locationDisplay: user.locationName ?? '',
  phone: user.phone ?? '',
  dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
});
