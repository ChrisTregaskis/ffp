import { useCallback, useMemo, useState } from 'react';

import { validatePassword, type PasswordValidationResult } from '@web/utils/passwordStrength';

export interface NewPasswordFieldsState {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  /** Also marks the confirm field as touched, so a mismatch shows only once it has been typed in */
  setConfirmPassword: (value: string) => void;
  validation: PasswordValidationResult;
  passwordsMatch: boolean;
  showConfirmPasswordError: boolean;
  /** Every requirement met and both entries match */
  isReady: boolean;
}

/** State for choosing a new password: the entry, its confirmation, and the strength reading. */
export const useNewPasswordFields = (): NewPasswordFieldsState => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPasswordValue] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const validation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword;

  const setConfirmPassword = useCallback((value: string): void => {
    setConfirmPasswordValue(value);
    setConfirmPasswordTouched(true);
  }, []);

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    validation,
    passwordsMatch,
    showConfirmPasswordError: Boolean(confirmPasswordTouched && confirmPassword && !passwordsMatch),
    isReady: validation.allRequirementsMet && passwordsMatch,
  };
};
