import { FormEmailInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

interface EmailFormValues {
  email: string;
}

/** The email field of the sign-in screens. Must sit inside a `ComposableForm` whose values have an `email`. */
export const AuthEmailField: React.FC = () => {
  const { register, errors } = useComposableFormContext<EmailFormValues>();

  return (
    <FormEmailInput<EmailFormValues>
      name="email"
      label="Email"
      placeholder="name@example.com"
      register={register}
      errors={errors}
      requiredMessage="Please enter your email address"
      // Cognito signs in by email, so it is the username password managers save and fill
      autoComplete="username"
    />
  );
};
