import { Button } from '@web/components/atoms';
import { useComposableFormContext } from '@web/components/organisms';

import { AuthEmailField } from './AuthEmailField';

export interface ForgotPasswordRequestFormFieldsProps {
  isLoading: boolean;
}

/** The email field and submit button for requesting a reset code. Must be rendered within a `<ComposableForm>`. */
export const ForgotPasswordRequestFormFields: React.FC<ForgotPasswordRequestFormFieldsProps> = ({
  isLoading,
}) => {
  const { isSubmitting } = useComposableFormContext();

  return (
    <>
      <AuthEmailField />

      <Button type="submit" loading={isLoading || isSubmitting} fullWidth>
        {isLoading ? 'Sending code...' : 'Send verification code'}
      </Button>
    </>
  );
};
