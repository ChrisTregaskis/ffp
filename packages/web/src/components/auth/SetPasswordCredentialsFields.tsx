import { Button } from '@web/components/atoms';
import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import type { SetPasswordCredentialsData } from '@web/schemas/auth.schema';

import { AuthEmailField } from './AuthEmailField';

export interface SetPasswordCredentialsFieldsProps {
  isLoading: boolean;
}

/** Email and temporary password. Must be rendered within a `<ComposableForm<SetPasswordCredentialsData>>`. */
export const SetPasswordCredentialsFields: React.FC<SetPasswordCredentialsFieldsProps> = ({
  isLoading,
}) => {
  const { register, errors, isSubmitting } = useComposableFormContext<SetPasswordCredentialsData>();

  return (
    <>
      <AuthEmailField />

      <FormTextInput<SetPasswordCredentialsData>
        name="temporaryPassword"
        label="Temporary password"
        type="password"
        placeholder="Enter temporary password from email"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please enter your temporary password' }}
      />

      <Button type="submit" loading={isLoading || isSubmitting} fullWidth>
        {isLoading ? 'Verifying...' : 'Continue'}
      </Button>
    </>
  );
};
