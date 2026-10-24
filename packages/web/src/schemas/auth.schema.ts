/** Form values only: each field validates itself (e.g. FormEmailInput) */
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SetPasswordCredentialsData {
  email: string;
  temporaryPassword: string;
}

export interface ForgotPasswordRequestData {
  email: string;
}
