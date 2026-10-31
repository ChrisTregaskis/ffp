import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AdminTagCategory } from '@ffp/core';

import { useTagCategoriesQuery } from '@web/hooks/tags';

import { VideoMetadataForm } from './VideoMetadataForm';

vi.mock('@web/hooks/tags', () => ({ useTagCategoriesQuery: vi.fn() }));

const tag = (
  category: AdminTagCategory['slug'],
  publicId: string,
  label: string
): AdminTagCategory['tags'][number] => ({
  publicId,
  slug: label.toLowerCase(),
  label,
  category,
  isActive: true,
});

const categories: AdminTagCategory[] = [
  { slug: 'goal', label: 'Goal', tags: [tag('goal', 'goposture001', 'Posture')] },
  { slug: 'body-area', label: 'Body area', tags: [tag('body-area', 'bacore000001', 'Core')] },
  { slug: 'movement', label: 'Movement', tags: [tag('movement', 'mvstrength01', 'Strength')] },
  { slug: 'audience', label: 'Audience', tags: [tag('audience', 'auseated0001', 'Seated')] },
];

describe('VideoMetadataForm', () => {
  it('sends the goal and audience tags and the essential flag', async () => {
    vi.mocked(useTagCategoriesQuery).mockReturnValue({
      data: categories,
      isError: false,
    } as ReturnType<typeof useTagCategoriesQuery>);
    const onSubmit = vi.fn();
    render(<VideoMetadataForm hasFile onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Video Title/), 'Wall sit');
    await userEvent.click(screen.getByRole('switch', { name: 'Essential' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Posture' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seated' }));
    await userEvent.click(screen.getByRole('button', { name: 'Upload Video' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isEssential: true,
        tags: {
          goal: ['goposture001'],
          'body-area': [],
          movement: [],
          audience: ['auseated0001'],
        },
      })
    );
  });
});
