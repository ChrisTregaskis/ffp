import React, { useState } from 'react';

import { Form, type Field, FieldDataType } from '../components/form';

interface TestFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const testFields: Field<TestFormValues>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email Address',
    dataType: FieldDataType.STRING,
    placeholder: 'you@example.com',
    validation: {
      isRequired: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  {
    order: 2,
    name: 'password',
    label: 'Password',
    dataType: FieldDataType.STRING,
    placeholder: '••••••••',
    validation: {
      isRequired: true,
      minLength: 8,
    },
  },
  {
    order: 3,
    name: 'confirmPassword',
    label: 'Confirm Password',
    dataType: FieldDataType.STRING,
    placeholder: '••••••••',
    validation: {
      isRequired: true,
      minLength: 8,
    },
  },
];

/**
 * Test page for Form pattern verification
 *
 * Tests:
 * - Field rendering (email, password, confirm password)
 * - Validation (required, minLength, pattern)
 * - Password show/hide toggle
 * - Form submission
 * - Error display
 */
export const FormTest: React.FC = () => {
  const [submittedValues, setSubmittedValues] = useState<TestFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: TestFormValues): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('Form submitted:', values);

    // Simulate API call
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    setSubmittedValues(values);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Form Pattern Test</h1>

        <p className="text-sm text-gray-600 mb-6">Test the form pattern with validation. Try:</p>
        <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
          <li>Submitting empty form (validation errors)</li>
          <li>Invalid email format</li>
          <li>Password less than 8 characters</li>
          <li>Password show/hide toggle</li>
          <li>Valid submission</li>
        </ul>

        <Form
          fields={testFields}
          onSubmit={handleSubmit}
          submitLabel="Test Submit"
          isLoading={isLoading}
        />

        {submittedValues && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800 mb-2">Submitted Values:</p>
            <pre className="text-xs text-green-700 overflow-x-auto">
              {JSON.stringify(submittedValues, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
