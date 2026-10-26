import { describe, expect, it } from 'vitest';

import { passwordValidation } from '@ffp/core';

import { validatePassword } from './passwordStrength';

// The user pool's policy (sst.config.ts): at least 8 characters, with a basic Latin upper and
// lower case letter, a number, and one of Cognito's special characters or a space that is
// neither leading nor trailing. Written out here rather than read from the code under test.
const COGNITO_SPECIAL_CHARACTERS = '^$*.[]{}()?"!@#%&/\\,><\':;|_~`=+-'.split('');

const ACCEPTED: [string, string][] = [
  ['exactly the minimum length', 'Abcdef1!'],
  ['a space between other characters as its special character', 'Abcd ef1'],
  ...COGNITO_SPECIAL_CHARACTERS.map((character): [string, string] => [
    `Cognito special character ${character}`,
    `Abcdef1${character}`,
  ]),
];

const REFUSED: [string, string][] = [
  ['one character short', 'Abcde1!'],
  ['no upper case letter', 'abcdef1!'],
  ['no lower case letter', 'ABCDEF1!'],
  ['no number', 'Abcdefg!'],
  ['no special character', 'Abcdefg1'],
  ['only a symbol Cognito does not count', 'Abcdefg1£'],
  ['only an accented letter', 'Abcdefg1é'],
  ['only a trailing space', 'Abcdefg1 '],
  ['only a leading space', ' Abcdefg1'],
];

describe('password rules', () => {
  it.each(ACCEPTED)('the form and the server both accept %s', (_case, password) => {
    expect(validatePassword(password).allRequirementsMet).toBe(true);
    expect(passwordValidation.safeParse(password).success).toBe(true);
  });

  it.each(REFUSED)('the form and the server both refuse %s', (_case, password) => {
    expect(validatePassword(password).allRequirementsMet).toBe(false);
    expect(passwordValidation.safeParse(password).success).toBe(false);
  });
});
