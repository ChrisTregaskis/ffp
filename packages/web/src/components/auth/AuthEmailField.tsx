import { EMAIL_PATTERN } from '@ffp/core';

import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

interface EmailFormValues {
  email: string;
}

/**
 * The email field of the sign-in screens. Must sit inside a `ComposableForm` whose values have an `email`.
 *
 * A text input with the email keyboard rather than `type="email"`: the browser's own email check
 * would show its bubble before the pattern rule's message.
 */
export const AuthEmailField: React.FC = () => {
  const { register, errors } = useComposableFormContext<EmailFormValues>();

  return (
    <FormTextInput<EmailFormValues>
      name="email"
      label="Email"
      placeholder="name@example.com"
      register={register}
      errors={errors}
      isRequired
      inputProps={{ inputMode: 'email' }}
      registerOptions={{
        // A text input keeps the trailing space a keyboard suggestion or paste leaves, which
        // `type="email"` used to strip
        setValueAs: (value: string) => value.trim(),
        required: 'Please enter your email address',
        pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
      }}
    />
  );
};
