import { signIn, confirmSignIn, type ConfirmSignInInput } from 'aws-amplify/auth';
import { useCallback, useState } from 'react';

import { CardTransition, type CardTransitionDirection } from '@web/components/motion';
import { useNewPasswordFields } from '@web/hooks/useNewPasswordFields';
import type { SetPasswordCredentialsData } from '@web/schemas/auth.schema';

import { SetPasswordCredentialsStep } from './SetPasswordCredentialsStep';
import { SetPasswordNewPasswordStep } from './SetPasswordNewPasswordStep';

export interface SetPasswordFormProps {
  /** Callback when password is successfully set and user is authenticated */
  onSuccess: () => Promise<void>;
  /** Optional initial email (e.g., from invitation link or redirect) */
  initialEmail?: string;
  /** Skip temporary password step (when redirected from login page after successful temp auth) */
  skipTempPasswordStep?: boolean;
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
 * 1. User enters email and temporary password (skipped if coming from login page)
 * 2. User sets new password after Cognito challenge is triggered
 */
export const SetPasswordForm: React.FC<SetPasswordFormProps> = ({
  onSuccess,
  initialEmail,
  skipTempPasswordStep = false,
  isLoading: externalLoading = false,
  error: externalError,
  onClearError,
}) => {
  const [currentStep, setCurrentStep] = useState<SetPasswordStep>(
    skipTempPasswordStep ? SetPasswordStep.SET_NEW_PASSWORD : SetPasswordStep.ENTER_CREDENTIALS
  );
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SetPasswordCredentialsData | null>(
    // If skipping temp password step, store email from initial value
    skipTempPasswordStep && initialEmail ? { email: initialEmail, temporaryPassword: '' } : null
  );

  // Held here rather than in step 2 so the entries survive going back to step 1
  const newPassword = useNewPasswordFields();

  const isLoading = externalLoading || internalLoading;
  const error = externalError ?? internalError;

  // Clears both, because the alert shows whichever is set
  const handleDismissError = useCallback((): void => {
    setInternalError(null);

    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

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
          setDirection('forward');
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
  const handleNewPasswordSubmit = useCallback(async (): Promise<void> => {
    // The submit button is disabled until both hold; this guards a submit that gets past it
    if (!newPassword.passwordsMatch) {
      setInternalError('Passwords do not match');

      return;
    }

    if (!newPassword.validation.allRequirementsMet) {
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
        challengeResponse: newPassword.password,
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
  }, [
    newPassword.password,
    newPassword.passwordsMatch,
    newPassword.validation.allRequirementsMet,
    onClearError,
    onSuccess,
  ]);

  /**
   * Handle going back to credentials step
   */
  const handleGoBack = useCallback((): void => {
    setDirection('backward');
    setCurrentStep(SetPasswordStep.ENTER_CREDENTIALS);
    setCredentials(null);
    setInternalError(null);

    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

  if (currentStep === SetPasswordStep.ENTER_CREDENTIALS) {
    return (
      <CardTransition transitionKey="credentials-step" direction={direction}>
        <SetPasswordCredentialsStep
          initialEmail={initialEmail}
          isLoading={isLoading}
          error={error}
          onDismissError={handleDismissError}
          onSubmit={handleCredentialsSubmit}
        />
      </CardTransition>
    );
  }

  return (
    <CardTransition transitionKey="password-step" direction={direction}>
      <SetPasswordNewPasswordStep
        email={credentials?.email}
        newPassword={newPassword}
        isLoading={isLoading}
        error={error}
        onDismissError={handleDismissError}
        onSubmit={handleNewPasswordSubmit}
        onGoBack={skipTempPasswordStep ? undefined : handleGoBack}
      />
    </CardTransition>
  );
};
