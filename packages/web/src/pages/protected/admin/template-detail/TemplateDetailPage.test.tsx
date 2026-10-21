import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { TemplateDetailResponse } from '@ffp/core';

import { ToastProvider } from '@web/contexts/toast/ToastContext';
import {
  useCreateTemplateMutation,
  useTemplateDetailQuery,
  useUpdateTemplateMutation,
} from '@web/hooks/programme-templates';
import { ApiError } from '@web/lib/api';

import { TemplateDetailPage } from './TemplateDetailPage';

vi.mock('@web/hooks/programme-templates', () => ({
  useTemplateDetailQuery: vi.fn(),
  useCreateTemplateMutation: vi.fn(),
  useUpdateTemplateMutation: vi.fn(),
}));

const TEMPLATE: TemplateDetailResponse = {
  id: '66666666-6666-6666-8666-666666660001',
  publicId: 'bbbbbbbbbbbb',
  slug: 'level-1-gentle-mobility',
  name: 'Level 1: Gentle Mobility',
  description: null,
  isActive: true,
  totalPhases: 0,
  difficulty: 'beginner',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  phases: [],
};

const REFUSAL = "This programme is recommended by 2 assessment flows, so its slug can't change";

// The data router hands jsdom's AbortSignal to Node's Request, which rejects a foreign signal
class SignalFreeRequest extends Request {
  constructor(input: RequestInfo | URL, init: RequestInit = {}) {
    const rest = { ...init };
    delete rest.signal;
    super(input, rest);
  }
}

beforeAll(() => {
  vi.stubGlobal('Request', SignalFreeRequest);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('TemplateDetailPage', () => {
  it("shows the server's refusal of a slug change and keeps the edit", async () => {
    const mutateAsync = vi.fn(
      (_variables: unknown, callbacks?: { onError?: (e: Error) => void }) => {
        const error = new ApiError(409, 'CONFLICT', REFUSAL);
        callbacks?.onError?.(error);

        return Promise.reject(error);
      }
    );
    vi.mocked(useTemplateDetailQuery).mockReturnValue({
      data: TEMPLATE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useTemplateDetailQuery>);
    vi.mocked(useUpdateTemplateMutation).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTemplateMutation>);
    vi.mocked(useCreateTemplateMutation).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTemplateMutation>);

    const router = createMemoryRouter(
      [{ path: '/templates/:id', element: <TemplateDetailPage /> }],
      { initialEntries: ['/templates/bbbbbbbbbbbb'] }
    );
    render(
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    );

    const slug = await screen.findByRole<HTMLInputElement>('textbox', { name: /Slug/ });
    await userEvent.clear(slug);
    await userEvent.type(slug, 'level-1-renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ data: { slug: 'level-1-renamed' } }),
        expect.anything()
      );
    });
    expect(await screen.findByText(REFUSAL)).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: /Slug/ }).value).toBe(
      'level-1-renamed'
    );
  });
});
