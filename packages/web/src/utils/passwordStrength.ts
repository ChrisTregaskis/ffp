import {
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER_PATTERN,
  PASSWORD_SPECIAL_CHAR_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from '@ffp/core';

/**
 * Password strength level
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

/**
 * Individual password requirement
 */
export interface PasswordRequirement {
  /** Unique identifier for the requirement */
  id: string;
  /** Description of the requirement */
  description: string;
  /** Validation function to check if requirement is met */
  validator: (password: string) => boolean;
  /** Whether this requirement is met */
  isMet: boolean;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  /** Overall strength of the password */
  strength: PasswordStrength | null;
  /** List of requirements with their current state */
  requirements: PasswordRequirement[];
  /** Whether all requirements are met */
  allRequirementsMet: boolean;
}

/**
 * Password requirements configuration matching Cognito policy
 */
const PASSWORD_REQUIREMENTS: Omit<PasswordRequirement, 'isMet'>[] = [
  {
    id: 'minLength',
    description: `At least ${PASSWORD_MIN_LENGTH.toString()} characters`,
    validator: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    description: 'At least one uppercase letter (A-Z)',
    validator: (password: string) => PASSWORD_UPPERCASE_PATTERN.test(password),
  },
  {
    id: 'lowercase',
    description: 'At least one lowercase letter (a-z)',
    validator: (password: string) => PASSWORD_LOWERCASE_PATTERN.test(password),
  },
  {
    id: 'number',
    description: 'At least one number (0-9)',
    validator: (password: string) => PASSWORD_NUMBER_PATTERN.test(password),
  },
  {
    id: 'specialChar',
    description: 'At least one special character (!@#$%^&*)',
    validator: (password: string) => PASSWORD_SPECIAL_CHAR_PATTERN.test(password),
  },
];

/**
 * Calculate password strength based on requirements met and additional criteria
 *
 * @param password - Password to evaluate
 * @returns Strength level (weak, medium, strong) or null if no password
 */
const calculateStrength = (
  password: string,
  allRequirementsMet: boolean
): PasswordStrength | null => {
  if (!password) {
    return null;
  }

  // Strength is only shown after all requirements are met
  if (!allRequirementsMet) {
    return null;
  }

  // Calculate additional strength factors
  const length = password.length;
  // Use global flag to match ALL occurrences, not just the first one
  const hasMultipleNumbers = (password.match(/[0-9]/g) ?? []).length >= 2;
  const hasMultipleSpecialChars = (password.match(/[^A-Za-z0-9]/g) ?? []).length >= 2;
  const hasNoRepeatingChars = !/(.)\1{2,}/.test(password); // No character repeated 3+ times

  let strengthScore = 0;

  // Length scoring
  if (length >= 8) {
    strengthScore += 1;
  }

  if (length >= 12) {
    strengthScore += 1;
  }

  if (length >= 16) {
    strengthScore += 1;
  }

  // Complexity scoring
  if (hasMultipleNumbers) {
    strengthScore += 1;
  }

  if (hasMultipleSpecialChars) {
    strengthScore += 1;
  }

  if (hasNoRepeatingChars) {
    strengthScore += 1;
  }

  // Determine strength level
  if (strengthScore >= 5) {
    return PasswordStrength.STRONG;
  } else if (strengthScore >= 3) {
    return PasswordStrength.MEDIUM;
  } else {
    return PasswordStrength.WEAK;
  }
};

/**
 * Validate password and return detailed validation result
 *
 * @param password - Password to validate
 * @returns Validation result with strength, requirements status
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  // Validate each requirement
  const requirements: PasswordRequirement[] = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    isMet: req.validator(password),
  }));

  // Check if all requirements are met
  const allRequirementsMet = requirements.every((req) => req.isMet);

  // Calculate strength
  const strength = calculateStrength(password, allRequirementsMet);

  return {
    strength,
    requirements,
    allRequirementsMet,
  };
};
