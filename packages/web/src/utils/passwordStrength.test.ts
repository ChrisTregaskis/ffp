import { describe, expect, it } from 'vitest';

import { validatePassword } from './passwordStrength';

// The user pool's policy (sst.config.ts): 8 to 256 characters, with a basic Latin upper and
// lower case letter, a number, and one of Cognito's special characters or a space that is
// neither leading nor trailing; no whitespace at either end. Written out here rather than read
// from the code under test.
const COGNITO_SPECIAL_CHARACTERS = '^$*.[]{}()?"!@#%&/\\,><\':;|_~`=+-'.split('');

const ACCEPTED: [string, string][] = [
  ['exactly the minimum length', 'Abcdef1!'],
  ['exactly the maximum length', `Abcdef1!${'a'.repeat(248)}`],
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
  ['one character over the maximum length', `Abcdef1!${'a'.repeat(249)}`],
  ['a leading space beside another special character', ' Abcdef1!'],
  ['a trailing space beside another special character', 'Abcdef1! '],
  ['a leading tab', '\tAbcdef1!'],
  ['a trailing line break', 'Abcdef1!\n'],
];

describe('password rules', () => {
  it.each(ACCEPTED)('the set-password checklist accepts %s', (_case, password) => {
    expect(validatePassword(password).allRequirementsMet).toBe(true);
  });

  it.each(REFUSED)('the set-password checklist refuses %s', (_case, password) => {
    expect(validatePassword(password).allRequirementsMet).toBe(false);
  });

  it('names the length and edge-space rules a password breaks', () => {
    const unmet = (password: string): string[] =>
      validatePassword(password)
        .requirements.filter((requirement) => !requirement.isMet)
        .map((requirement) => requirement.description);

    expect(unmet(`Abcdef1!${'a'.repeat(249)}`)).toEqual(['No more than 256 characters']);
    expect(unmet(' Abcdef1!')).toEqual(['No space at the start or end']);
  });
});
