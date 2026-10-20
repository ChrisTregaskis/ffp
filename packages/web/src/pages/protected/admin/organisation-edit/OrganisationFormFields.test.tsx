import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ComposableForm } from '@web/components/organisms';

import { OrganisationFormFields } from './OrganisationFormFields';

import type { OrganisationFormValues } from './types';

const renderForm = (): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn();
  render(
    <ComposableForm<OrganisationFormValues>
      onSubmit={onSubmit}
      defaultValues={{ organisationName: '', status: 'active' }}
    >
      <OrganisationFormFields isEditMode={false} onCancel={vi.fn()} />
    </ComposableForm>
  );

  return onSubmit;
};

const create = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Create Organisation' }));
};

describe('OrganisationFormFields', () => {
  it('refuses an empty name', async () => {
    const onSubmit = renderForm();
    create();

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Please give the organisation a name'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a named organisation', async () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByRole('textbox', { name: 'Organisation Name (required)' }), {
      target: { value: 'Harbour Wellness' },
    });
    create();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
