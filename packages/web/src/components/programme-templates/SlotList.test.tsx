import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminTagCategory, SessionSlotsResponse, SlotResponse } from '@ffp/core';

import { ToastProvider } from '@web/contexts/toast/ToastContext';
import { useTagCategoriesQuery } from '@web/hooks/tags';
import { adminSlotsApi } from '@web/lib/api/endpoints';
import type * as Endpoints from '@web/lib/api/endpoints';

import { SlotList } from './SlotList';

vi.mock('@web/hooks/tags', () => ({ useTagCategoriesQuery: vi.fn() }));

vi.mock('@web/lib/api/endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof Endpoints>()),
  adminSlotsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
  },
}));

const SESSION_ID = '99999999-9999-9999-8999-999999990001';

const tag = (
  category: AdminTagCategory['slug'],
  publicId: string,
  label: string,
  isActive = true
): AdminTagCategory['tags'][number] => ({
  publicId,
  slug: label.toLowerCase(),
  label,
  category,
  isActive,
});

const CATEGORIES: AdminTagCategory[] = [
  { slug: 'goal', label: 'Goal', tags: [] },
  { slug: 'body-area', label: 'Body area', tags: [tag('body-area', 'baglutes0001', 'Glutes')] },
  {
    slug: 'movement',
    label: 'Movement',
    tags: [
      tag('movement', 'mvstretch001', 'Stretch'),
      tag('movement', 'mvretired001', 'Retired', false),
    ],
  },
  { slug: 'audience', label: 'Audience', tags: [] },
];

const slot = (overrides: Partial<SlotResponse> & { publicId: string }): SlotResponse => ({
  orderIndex: 0,
  category: 'movement',
  categoryLabel: 'Movement',
  tags: [],
  isRequired: true,
  label: null,
  poolSize: 4,
  isPoolEmpty: false,
  hasInactiveTags: false,
  ...overrides,
});

const api = vi.mocked(adminSlotsApi);

const renderList = (response: SessionSlotsResponse): void => {
  api.list.mockResolvedValue(response);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider>
        <SlotList sessionId={SESSION_ID} />
      </ToastProvider>
    </QueryClientProvider>
  );
};

const openMenuItem = async (row: HTMLElement, item: string): Promise<void> => {
  await userEvent.click(within(row).getByRole('button', { name: 'More actions' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: item }));
};

const rowOf = async (text: string): Promise<HTMLElement> => {
  const label = await screen.findByText(text);
  const row = label.closest('[class*="flex items-center gap-3"]');

  if (!(row instanceof HTMLElement)) {
    throw new Error(`No row holds "${text}"`);
  }

  return row;
};

describe('SlotList', () => {
  beforeAll(() => {
    // jsdom has no layout, so the select's highlighted option can't scroll into view
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useTagCategoriesQuery).mockReturnValue({
      data: CATEGORIES,
      isError: false,
    } as ReturnType<typeof useTagCategoriesQuery>);
  });

  it('shows each slot with its pool size and warnings, and a short session', async () => {
    renderList({
      slots: [
        slot({
          publicId: 'slot00000001',
          label: 'Warm-up',
          tags: [
            { publicId: 'mvstretch001', slug: 'stretch', label: 'Stretch', isActive: true },
            { publicId: 'mvretired001', slug: 'retired', label: 'Retired', isActive: false },
          ],
          poolSize: 1,
          hasInactiveTags: true,
        }),
        slot({
          publicId: 'slot00000002',
          orderIndex: 1,
          category: 'audience',
          categoryLabel: 'Audience',
          isRequired: false,
          poolSize: 0,
          isPoolEmpty: true,
        }),
      ],
      hasTooFewSlots: true,
    });

    expect(await screen.findByText('Warm-up')).toBeTruthy();
    expect(screen.getByText('Movement: Stretch, Retired (inactive)')).toBeTruthy();
    expect(screen.getByText('1 exercise in pool')).toBeTruthy();
    expect(screen.getByText('Inactive tag')).toBeTruthy();
    expect(screen.getByText('Any audience')).toBeTruthy();
    expect(screen.getByText('Optional')).toBeTruthy();
    expect(screen.getByText('0 exercises in pool')).toBeTruthy();
    expect(screen.getByText('Empty pool')).toBeTruthy();
    expect(screen.getByText(/This session has 2 of the 3 to 5 slots/)).toBeTruthy();
  });

  it('adds a slot with the chosen category, tags and tier', async () => {
    renderList({ slots: [], hasTooFewSlots: true });
    api.create.mockResolvedValue(slot({ publicId: 'slot00000009' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Add Slot' }));
    await userEvent.click(screen.getByRole('combobox', { name: /Category/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Movement' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Stretch' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Required' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Label/ }), ' Cool-down ');
    await userEvent.click(screen.getByRole('button', { name: 'Add Slot' }));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(SESSION_ID, {
        category: 'movement',
        tags: ['mvstretch001'],
        isRequired: false,
        label: 'Cool-down',
      });
    });
    // Only the slot's own inactive tags are offered
    expect(screen.queryByRole('checkbox', { name: /Retired/ })).toBeNull();
  });

  it('clears the tags when the category changes, and sends both', async () => {
    renderList({
      slots: [
        slot({
          publicId: 'slot00000001',
          label: 'Warm-up',
          tags: [{ publicId: 'mvstretch001', slug: 'stretch', label: 'Stretch', isActive: true }],
        }),
      ],
      hasTooFewSlots: true,
    });
    api.update.mockResolvedValue(slot({ publicId: 'slot00000001' }));

    await openMenuItem(await rowOf('Warm-up'), 'Edit');
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Stretch' }).checked).toBe(true);
    await userEvent.click(screen.getByRole('combobox', { name: /Category/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Body area' }));

    expect(screen.queryByRole('checkbox', { name: 'Stretch' })).toBeNull();
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Glutes' }).checked).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.update).toHaveBeenCalledWith('slot00000001', { category: 'body-area', tags: [] });
    });
  });

  it('keeps a deactivated tag the slot names on offer when editing', async () => {
    renderList({
      slots: [
        slot({
          publicId: 'slot00000001',
          label: 'Warm-up',
          tags: [{ publicId: 'mvretired001', slug: 'retired', label: 'Retired', isActive: false }],
          hasInactiveTags: true,
        }),
      ],
      hasTooFewSlots: true,
    });

    await openMenuItem(await rowOf('Warm-up'), 'Edit');

    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Retired (inactive)' }).checked
    ).toBe(true);
  });

  it('moves a slot down by sending the new order', async () => {
    renderList({
      slots: [
        slot({ publicId: 'slot00000001', label: 'First' }),
        slot({ publicId: 'slot00000002', orderIndex: 1, label: 'Second' }),
      ],
      hasTooFewSlots: true,
    });
    api.reorder.mockResolvedValue({ slots: [], hasTooFewSlots: true });

    await openMenuItem(await rowOf('First'), 'Move down');

    await waitFor(() => {
      expect(api.reorder).toHaveBeenCalledWith(SESSION_ID, {
        orderedIds: ['slot00000002', 'slot00000001'],
      });
    });
  });

  it('asks before removing a slot', async () => {
    renderList({
      slots: [slot({ publicId: 'slot00000001', label: 'Warm-up' })],
      hasTooFewSlots: true,
    });
    api.delete.mockResolvedValue();

    await openMenuItem(await rowOf('Warm-up'), 'Delete');

    expect(api.delete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /Delete|Remove/ }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('slot00000001');
    });
  });

  it('offers no sixth slot', async () => {
    renderList({
      slots: Array.from({ length: 5 }, (_, index) =>
        slot({
          publicId: `slot0000000${String(index)}`,
          orderIndex: index,
          label: `Slot ${String(index)}`,
        })
      ),
      hasTooFewSlots: false,
    });

    const add = await screen.findByRole<HTMLButtonElement>('button', { name: 'Add Slot' });

    expect(add.disabled).toBe(true);
    expect(screen.getByText('A session holds at most 5 slots')).toBeTruthy();
    expect(screen.queryByText(/This session has/)).toBeNull();
  });
});
