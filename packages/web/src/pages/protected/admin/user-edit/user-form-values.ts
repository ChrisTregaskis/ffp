import type { AdminUpdateUserInput, UserDetailResponse } from '@ffp/core';

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

/** A stored date as the form's YYYY-MM-DD field value. */
const toDateField = (date: Date): string => new Date(date).toISOString().split('T')[0];

export const toUserFormValues = (user: UserDetailResponse): UserFormValues => ({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  locationId: user.locationId ?? '',
  locationDisplay: user.locationName ?? '',
  phone: user.phone ?? '',
  dateOfBirth: user.dateOfBirth ? toDateField(user.dateOfBirth) : '',
});

/** The date of birth as a Date, or undefined when blank or not a valid date. */
export const parseDateOfBirth = (value: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

/** Only the fields that differ from the stored user; an empty object means nothing changed. */
export const toUpdateUserInput = (
  values: UserFormValues,
  user: UserDetailResponse
): AdminUpdateUserInput => {
  const payload: AdminUpdateUserInput = {};

  if (values.firstName !== user.firstName) {
    payload.firstName = values.firstName;
  }

  if (values.lastName !== user.lastName) {
    payload.lastName = values.lastName;
  }

  const newPhone = values.phone || null;

  if (newPhone !== (user.phone ?? null)) {
    payload.phone = newPhone;
  }

  const newDob = values.dateOfBirth || null;
  const currentDob = user.dateOfBirth ? toDateField(user.dateOfBirth) : null;

  if (newDob !== currentDob) {
    payload.dateOfBirth = newDob ? (parseDateOfBirth(newDob) ?? null) : null;
  }

  return payload;
};
