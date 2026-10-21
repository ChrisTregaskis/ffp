import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminTag, AdminTagCategory } from '@ffp/core';

import { ToastProvider } from '@web/contexts/toast/ToastContext';
import { adminTagsApi, ApiError } from '@web/lib/api';
import type * as Api from '@web/lib/api';

import { ExerciseTagsPage } from './ExerciseTagsPage';

vi.mock('@web/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof Api>();

  return {
    ...actual,
    adminTagsApi: {
      listCategories: vi.fn(),
      createTag: vi.fn(),
      updateTag: vi.fn(),
      deactivateTag: vi.fn(),
    },
  };
});

const posture: AdminTag = {
  publicId: 'goposture001',
  slug: 'posture',
  label: 'Posture',
  category: 'goal',
  isActive: true,
};
const retired: AdminTag = {
  publicId: 'goretired001',
  slug: 'retired',
  label: 'Retired goal',
  category: 'goal',
  isActive: false,
};

const CATEGORIES: AdminTagCategory[] = [
  { slug: 'goal', label: 'Goal', tags: [posture, retired] },
  { slug: 'body-area', label: 'Body area', tags: [] },
  { slug: 'movement', label: 'Movement', tags: [] },
  { slug: 'audience', label: 'Audience', tags: [] },
];

const api = vi.mocked(adminTagsApi);

/** Renders the page and resolves to the Goal category's section */
const renderGoalSection = async (): Promise<HTMLElement> => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider>
        <ExerciseTagsPage />
      </ToastProvider>
    </QueryClientProvider>
  );

  return await screen.findByRole('region', { name: 'Goal' });
};

describe('ExerciseTagsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.listCategories.mockResolvedValue(CATEGORIES);
  });

  it('lists every category, with active and inactive tags', async () => {
    const goal = within(await renderGoalSection());

    for (const name of ['Goal', 'Body area', 'Movement', 'Audience']) {
      expect(screen.getByRole('region', { name })).toBeTruthy();
    }
    expect(goal.getByText('Posture')).toBeTruthy();
    expect(goal.getByText('Inactive')).toBeTruthy();
  });

  it('adds a tag with the slug filled from its label', async () => {
    api.createTag.mockResolvedValue({
      ...posture,
      publicId: 'gobetter0001',
      slug: 'better-posture',
    });
    const goal = within(await renderGoalSection());

    await userEvent.click(goal.getByRole('button', { name: 'Add tag' }));
    await userEvent.type(goal.getByRole('textbox', { name: /Label/ }), 'Better posture');
    expect(goal.getByRole<HTMLInputElement>('textbox', { name: /Slug/ }).value).toBe(
      'better-posture'
    );
    await userEvent.click(goal.getByRole('button', { name: 'Add Tag' }));

    await waitFor(() => {
      expect(api.createTag).toHaveBeenCalledWith({
        category: 'goal',
        slug: 'better-posture',
        label: 'Better posture',
      });
    });
  });

  it('shows a taken slug on the slug field until the slug changes', async () => {
    api.createTag.mockRejectedValue(new ApiError(409, 'CONFLICT', 'Tag already exists'));
    const goal = within(await renderGoalSection());

    await userEvent.click(goal.getByRole('button', { name: 'Add tag' }));
    await userEvent.type(goal.getByRole('textbox', { name: /Label/ }), 'Posture');
    await userEvent.click(goal.getByRole('button', { name: 'Add Tag' }));

    const slug = goal.getByRole('textbox', { name: /Slug/ });
    await waitFor(() => {
      expect(slug.getAttribute('aria-invalid')).toBe('true');
    });
    expect(goal.getByText(/already has a tag with this slug/)).toBeTruthy();

    await userEvent.type(slug, '-seated');
    expect(slug.getAttribute('aria-invalid')).not.toBe('true');
    expect(goal.queryByText(/already has a tag with this slug/)).toBe(null);
  });

  it('renames a tag without touching its slug', async () => {
    api.updateTag.mockResolvedValue({ ...posture, label: 'Upright posture' });
    const goal = within(await renderGoalSection());

    await userEvent.click(goal.getByRole('button', { name: 'Rename Posture' }));
    const label = goal.getByRole('textbox', { name: /Label/ });
    await userEvent.clear(label);
    await userEvent.type(label, 'Upright posture');
    await userEvent.click(goal.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.updateTag).toHaveBeenCalledWith('goposture001', { label: 'Upright posture' });
    });
  });

  it('deactivates a tag once confirmed', async () => {
    api.deactivateTag.mockResolvedValue();
    const goal = within(await renderGoalSection());

    await userEvent.click(goal.getByRole('button', { name: 'Deactivate Posture' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Deactivate tag' }));

    await waitFor(() => {
      expect(api.deactivateTag).toHaveBeenCalledWith('goposture001');
    });
  });

  it('reactivates an inactive tag', async () => {
    api.updateTag.mockResolvedValue({ ...retired, isActive: true });
    const goal = within(await renderGoalSection());

    await userEvent.click(goal.getByRole('button', { name: 'Reactivate Retired goal' }));

    await waitFor(() => {
      expect(api.updateTag).toHaveBeenCalledWith('goretired001', { isActive: true });
    });
  });
});
