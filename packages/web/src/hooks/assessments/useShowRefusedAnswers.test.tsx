import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialState } from '@web/contexts/assessments/helpers';

import { useShowRefusedAnswers } from './useShowRefusedAnswers';

import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({ getTemplate: vi.fn(), dispatch: vi.fn() }));

vi.mock('@web/lib/api', () => ({ assessmentsApi: { getTemplate: mocks.getTemplate } }));
vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({
    assessmentState: {
      ...createInitialState('flow-1'),
      steps: [
        { id: 'intro', order: 1, type: 'intro', config: {}, templateId: null },
        { id: 'goals', order: 2, type: 'questions', config: {}, templateId: 'template-goals' },
        { id: 'safety', order: 3, type: 'questions', config: {}, templateId: 'template-safety' },
      ],
    },
    assessmentDispatch: mocks.dispatch,
  }),
}));

const TEMPLATES: Record<string, { templateQuestions: { id: string }[] }> = {
  'template-goals': { templateQuestions: [{ id: 'q-goal' }] },
  'template-safety': { templateQuestions: [{ id: 'q-safety' }] },
};

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const show = (fieldErrors: Record<string, string>): Promise<boolean> =>
  renderHook(() => useShowRefusedAnswers(), { wrapper }).result.current(fieldErrors);

describe('useShowRefusedAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTemplate.mockImplementation((templateId: string) =>
      Promise.resolve(TEMPLATES[templateId])
    );
  });

  it('holds the messages and goes to the first step showing a refused question', async () => {
    await expect(show({ 'q-safety': 'Please answer this question.' })).resolves.toBe(true);

    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_ERRORS',
      payload: { fieldErrors: { 'q-safety': 'Please answer this question.' } },
    });
    expect(mocks.dispatch).toHaveBeenLastCalledWith({
      type: 'GO_TO_STEP',
      payload: { stepId: 'safety' },
    });
  });

  it('reports a refusal naming no question the flow shows', async () => {
    await expect(
      show({ 'q-unknown': 'This question is not part of your assessment.' })
    ).resolves.toBe(false);
    expect(mocks.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'GO_TO_STEP' })
    );
  });

  it('reports a refusal it could not place because the questions failed to load', async () => {
    mocks.getTemplate.mockRejectedValue(new Error('Network error'));

    await expect(show({ 'q-goal': 'Please answer this question.' })).resolves.toBe(false);
  });

  it('does nothing for a failure that names no question', async () => {
    await expect(show({})).resolves.toBe(false);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
});
