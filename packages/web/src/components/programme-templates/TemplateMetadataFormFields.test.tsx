import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ComposableForm } from '@web/components/organisms';

import { TemplateMetadataFormFields } from './TemplateMetadataFormFields';

import type { TemplateMetadataFormValues } from './types';

// Difficulty is seeded so a submit needs no select interaction
const NEW_TEMPLATE: TemplateMetadataFormValues = {
  name: '',
  slug: '',
  description: '',
  difficulty: 'beginner',
  isActive: 'true',
};

const STORED_TEMPLATE: TemplateMetadataFormValues = {
  name: 'Gentle Mobility',
  slug: 'gentle-mobility',
  description: 'An easy start.',
  difficulty: 'beginner',
  isActive: 'true',
};

const renderFields = (
  isEditMode: boolean,
  values: TemplateMetadataFormValues
): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn();

  render(
    <ComposableForm<TemplateMetadataFormValues> onSubmit={onSubmit} defaultValues={values}>
      <TemplateMetadataFormFields isEditMode={isEditMode} onCancel={vi.fn()} />
    </ComposableForm>
  );

  return onSubmit;
};

const nameInput = (): HTMLInputElement =>
  screen.getByRole<HTMLInputElement>('textbox', { name: /Template Name/ });
const slugInput = (): HTMLInputElement =>
  screen.getByRole<HTMLInputElement>('textbox', { name: /Slug/ });

describe('TemplateMetadataFormFields create mode', () => {
  it('leaves the status field out', () => {
    renderFields(false, NEW_TEMPLATE);

    expect(screen.queryByText('Status')).toBeNull();
  });

  it('fills the slug from the name and submits the new template', async () => {
    const onSubmit = renderFields(false, NEW_TEMPLATE);

    fireEvent.change(nameInput(), { target: { value: 'Gentle Mobility Programme' } });

    await waitFor(() => {
      expect(slugInput().value).toBe('gentle-mobility-programme');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Template' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gentle Mobility Programme',
          slug: 'gentle-mobility-programme',
        }),
        expect.anything()
      );
    });
  });
});

describe('TemplateMetadataFormFields edit mode', () => {
  it('shows the status field and saves rather than creates', () => {
    renderFields(true, STORED_TEMPLATE);

    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy();
  });
});
