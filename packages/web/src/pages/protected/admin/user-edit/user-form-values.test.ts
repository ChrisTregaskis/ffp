import { describe, expect, it } from 'vitest';

import type { UserDetailResponse } from '@ffp/core';

import { parseDateOfBirth, toUpdateUserInput, toUserFormValues } from './user-form-values';

const stored = (overrides: Partial<UserDetailResponse> = {}): UserDetailResponse => ({
  id: '88888888-8888-8888-8888-888888880001',
  publicId: 'eeeeeeeeeeee',
  organisationId: '66666666-6666-6666-8666-666666660001',
  email: 'sam@example.com',
  cognitoSub: 'sub-1',
  firstName: 'Sam',
  lastName: 'Taylor',
  role: 'programme_user',
  locationId: '77777777-7777-7777-8777-777777770001',
  locationName: 'Quayside Studio',
  profileImageUrl: null,
  phone: '07700 900000',
  dateOfBirth: new Date('1990-04-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('parseDateOfBirth', () => {
  it('is undefined when blank or not a date', () => {
    expect(parseDateOfBirth('')).toBeUndefined();
    expect(parseDateOfBirth('not-a-date')).toBeUndefined();
  });

  it('parses a valid date', () => {
    expect(parseDateOfBirth('1990-04-01')).toEqual(new Date('1990-04-01'));
  });
});

describe('toUpdateUserInput', () => {
  it('sends nothing when the form matches the stored user', () => {
    const user = stored();

    expect(toUpdateUserInput(toUserFormValues(user), user)).toEqual({});
  });

  it('sends only the changed field', () => {
    const user = stored();

    expect(toUpdateUserInput({ ...toUserFormValues(user), lastName: 'Jones' }, user)).toEqual({
      lastName: 'Jones',
    });
  });

  it('clears a blanked phone and date of birth with null', () => {
    const user = stored();

    expect(
      toUpdateUserInput({ ...toUserFormValues(user), phone: '', dateOfBirth: '' }, user)
    ).toEqual({ phone: null, dateOfBirth: null });
  });

  it('treats blank fields over null stored values as unchanged', () => {
    const user = stored({ phone: null, dateOfBirth: null });

    expect(toUpdateUserInput(toUserFormValues(user), user)).toEqual({});
  });

  it('sends a changed date of birth as a Date', () => {
    const user = stored();

    expect(
      toUpdateUserInput({ ...toUserFormValues(user), dateOfBirth: '1991-05-02' }, user)
    ).toEqual({ dateOfBirth: new Date('1991-05-02') });
  });
});
