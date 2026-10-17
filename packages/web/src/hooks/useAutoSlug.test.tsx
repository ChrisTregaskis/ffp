import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormTextInput } from '@web/components/molecules';
import { ComposableForm, useComposableFormContext } from '@web/components/organisms';

import { useAutoSlug } from './useAutoSlug';

interface SlugFormValues {
  name: string;
  slug: string;
}

interface SlugFieldsProps {
  enabled?: boolean;
  maxLength?: number;
}

const SlugFields: React.FC<SlugFieldsProps> = ({ enabled, maxLength }) => {
  const { register, errors } = useComposableFormContext<SlugFormValues>();

  useAutoSlug<SlugFormValues>('name', 'slug', { enabled, maxLength });

  return (
    <>
      <FormTextInput<SlugFormValues> name="name" label="Name" register={register} errors={errors} />
      <FormTextInput<SlugFormValues> name="slug" label="Slug" register={register} errors={errors} />
    </>
  );
};

const renderSlugForm = (
  props: SlugFieldsProps = {},
  defaultValues: SlugFormValues = { name: '', slug: '' }
): void => {
  render(
    <ComposableForm<SlugFormValues> onSubmit={vi.fn()} defaultValues={defaultValues}>
      <SlugFields {...props} />
    </ComposableForm>
  );
};

const input = (label: string): HTMLInputElement => screen.getByLabelText(label);

const typeInto = (label: string, value: string): void => {
  fireEvent.change(input(label), { target: { value } });
};

describe('useAutoSlug', () => {
  it('follows the source field', () => {
    renderSlugForm();

    typeInto('Name', 'Gentle Mobility');
    expect(input('Slug').value).toBe('gentle-mobility');

    typeInto('Name', 'Gentle Mobility Plus');
    expect(input('Slug').value).toBe('gentle-mobility-plus');
  });

  it('stops following once the author edits the slug', () => {
    renderSlugForm();

    typeInto('Name', 'Gentle Mobility');
    typeInto('Slug', 'my-own-slug');
    typeInto('Name', 'Something Else');

    expect(input('Slug').value).toBe('my-own-slug');
  });

  it('resumes once the author clears the slug', () => {
    renderSlugForm();

    typeInto('Slug', 'my-own-slug');
    typeInto('Slug', '');
    typeInto('Name', 'Fresh Start');

    expect(input('Slug').value).toBe('fresh-start');
  });

  it('caps the slug without leaving a trailing hyphen', () => {
    renderSlugForm({ maxLength: 7 });

    typeInto('Name', 'Gentle Mobility');

    expect(input('Slug').value).toBe('gentle');
  });

  it('leaves the slug alone when disabled', () => {
    renderSlugForm({ enabled: false }, { name: 'Saved Name', slug: 'saved-slug' });

    typeInto('Name', 'Renamed');

    expect(input('Slug').value).toBe('saved-slug');
  });
});
