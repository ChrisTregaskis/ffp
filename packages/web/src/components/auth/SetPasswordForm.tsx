import { signIn, confirmSignIn, type ConfirmSignInInput } from 'aws-amplify/auth';
import { useCallback, useState, useMemo } from 'react';

import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Form } from '@web/components/form';
import { PasswordInput } from '@web/components/form/password/PasswordInput';
import { PasswordRequirementsList } from '@web/components/form/password/PasswordRequirementsList';
import { CardTransition } from '@web/components/motion';
import { Text } from '@web/components/text/Text';
import { validatePassword } from '@web/utils/passwordStrength';

import { setPasswordCredentialsFields, type SetPasswordCredentialsData } from '.';

export interface SetPasswordFormProps {
  /** Callback when password is successfully set and user is authenticated */
  onSuccess: () => Promise<void>;
  /** Optional initial email (e.g., from invitation link or redirect) */
  initialEmail?: string;
  /** Loading state during authentication */
  isLoading?: boolean;
  /** Error message from authentication */
  error?: string | null;
  /** Clear error on user interaction */
  onClearError?: () => void;
}

/**
 * Form steps for the set password flow
 */
enum SetPasswordStep {
  ENTER_CREDENTIALS = 'ENTER_CREDENTIALS',
  SET_NEW_PASSWORD = 'SET_NEW_PASSWORD',
}

/**
 * Set password form organism component.
 *
 * Two-step flow:
 * 1. User enters email and temporary password
 * 2. User sets new password after Cognito challenge is triggered
 */
export const SetPasswordForm: React.FC<SetPasswordFormProps> = ({
  onSuccess,
  initialEmail,
  isLoading: externalLoading = false,
  error: externalError,
  onClearError,
}) => {
  const [currentStep, setCurrentStep] = useState<SetPasswordStep>(
    SetPasswordStep.ENTER_CREDENTIALS
  );
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SetPasswordCredentialsData | null>(null);

  // Password step state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const isLoading = externalLoading || internalLoading;
  const error = externalError ?? internalError;

  // Validate password in real-time
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;
  const showConfirmPasswordError = Boolean(
    confirmPasswordTouched && confirmPassword && !passwordsMatch
  );

  /**
   * Handle credentials submission (Step 1)
   *
   * Attempts to sign in with temporary password, which should trigger
   * the NEW_PASSWORD_REQUIRED challenge from Cognito.
   */
  const handleCredentialsSubmit = useCallback(
    async (data: SetPasswordCredentialsData): Promise<void> => {
      try {
        setInternalLoading(true);
        setInternalError(null);

        if (onClearError) {
          onClearError();
        }

        // Attempt sign in with temporary password
        const result = await signIn({
          username: data.email,
          password: data.temporaryPassword,
        });

        // Check if Cognito requires a new password
        if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          // Store credentials and move to next step
          setCredentials(data);
          setCurrentStep(SetPasswordStep.SET_NEW_PASSWORD);
        } else if (result.isSignedIn) {
          // User is already signed in (shouldn't happen for invited users)
          await onSuccess();
        } else {
          throw new Error('Unexpected sign-in state. Please contact support.');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to verify temporary password';
        setInternalError(errorMessage);
      } finally {
        setInternalLoading(false);
      }
    },
    [onClearError, onSuccess]
  );

  /**
   * Handle new password submission (Step 2)
   *
   * Completes the NEW_PASSWORD_REQUIRED challenge by setting the user's
   * permanent password.
   */
  const handleNewPasswordSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();

      // Validate passwords match
      if (!passwordsMatch) {
        setInternalError('Passwords do not match');
        return;
      }

      // Validate all requirements are met
      if (!passwordValidation.allRequirementsMet) {
        setInternalError('Please meet all password requirements');
        return;
      }

      try {
        setInternalLoading(true);
        setInternalError(null);
        if (onClearError) {
          onClearError();
        }

        // Complete the new password challenge
        const confirmInput: ConfirmSignInInput = {
          challengeResponse: password,
        };

        const result = await confirmSignIn(confirmInput);

        if (result.isSignedIn) {
          // Password successfully set, user is now authenticated
          await onSuccess();
        } else {
          throw new Error('Failed to complete password setup. Please try again.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set new password';
        setInternalError(errorMessage);
      } finally {
        setInternalLoading(false);
      }
    },
    [password, passwordsMatch, passwordValidation.allRequirementsMet, onClearError, onSuccess]
  );

  /**
   * Handle going back to credentials step
   */
  const handleGoBack = useCallback((): void => {
    setCurrentStep(SetPasswordStep.ENTER_CREDENTIALS);
    setCredentials(null);
    setInternalError(null);

    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

  // Render credentials step
  if (currentStep === SetPasswordStep.ENTER_CREDENTIALS) {
    return (
      <CardTransition transitionKey="credentials-step">
        <Card
          title="Set your password"
          subtitle="Enter your email and temporary password to get started."
          centerHeader
        >
          {/* Error display */}
          {error && (
            <StaticAlert
              variant="error"
              message={error}
              onDismiss={
                onClearError ??
                (() => {
                  setInternalError(null);
                })
              }
              className="mb-6"
            />
          )}

          {/* Credentials form */}
          <div className="space-y-6">
            <Form
              fields={setPasswordCredentialsFields}
              onSubmit={handleCredentialsSubmit}
              submitLabel={isLoading ? 'Verifying...' : 'Continue'}
              isSubmitting={isLoading}
              defaultValues={initialEmail ? { email: initialEmail } : undefined}
            />
          </div>
        </Card>
      </CardTransition>
    );
  }

  // Render new password step
  return (
    <CardTransition transitionKey="password-step">
      <Card
        title="Create your password"
        subtitle={`Set a secure password for ${credentials?.email ?? 'your account'}.`}
        centerHeader
      >
        {/* Error display */}
        {error && (
          <StaticAlert
            variant="error"
            message={error}
            onDismiss={
              onClearError ??
              (() => {
                setInternalError(null);
              })
            }
            className="mb-6"
          />
        )}

        {/* New password form */}
        <form
          onSubmit={(e) => {
            void handleNewPasswordSubmit(e);
          }}
          className="space-y-6"
        >
          {/* Password input with strength indicator */}
          <PasswordInput
            label="New password"
            placeholder="Create a secure password"
            value={password}
            onChange={setPassword}
            name="password"
            strength={passwordValidation.strength}
            showStrength
            disabled={isLoading}
          />

          {/* Password requirements list */}
          <div className="space-y-3">
            <Text styleProps={{ size: 'sm', weight: 'medium' }} className="text-gray-700">
              Password requirements:
            </Text>
            <PasswordRequirementsList requirements={passwordValidation.requirements} />
          </div>

          {/* Confirm password input */}
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setConfirmPasswordTouched(true);
            }}
            name="confirmPassword"
            hasError={showConfirmPasswordError}
            errorMessage="Passwords do not match"
            disabled={isLoading}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading || !passwordValidation.allRequirementsMet || !passwordsMatch}
          >
            {isLoading ? 'Setting password...' : 'Set password'}
          </Button>

          {/* Back button */}
          <div className="flex justify-center -mt-2">
            <Button
              variant="link"
              size="sm"
              onClick={handleGoBack}
              type="button"
              disabled={isLoading}
            >
              Go back
            </Button>
          </div>
        </form>
      </Card>
    </CardTransition>
  );
};
