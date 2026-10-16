import { Button } from '@web/components/atoms';
import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import type { LoginFormData } from '@web/schemas/auth.schema';

import { AuthEmailField } from './AuthEmailField';

export interface LoginFormFieldsProps {
  isLoading: boolean;
}

/** The sign-in fields and submit button. Must be rendered within a `<ComposableForm<LoginFormData>>`. */
export const LoginFormFields: React.FC<LoginFormFieldsProps> = ({ isLoading }) => {
  const { register, errors, isSubmitting } = useComposableFormContext<LoginFormData>();

  return (
    <>
      <AuthEmailField />

      <FormTextInput<LoginFormData>
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please enter your password' }}
      />

      <Button type="submit" loading={isLoading || isSubmitting} fullWidth>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </>
  );
};
