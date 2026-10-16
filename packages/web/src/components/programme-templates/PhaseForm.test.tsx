import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PhaseForm } from './PhaseForm';

const renderForm = (): ReturnType<typeof vi.fn> => {
  const onSubmit = vi.fn();
  render(<PhaseForm onSubmit={onSubmit} onCancel={vi.fn()} />);

  return onSubmit;
};

const name = (): HTMLElement => screen.getByRole('textbox', { name: 'Phase Name (required)' });
const save = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('PhaseForm', () => {
  it('refuses an empty name', async () => {
    const onSubmit = renderForm();
    save();

    expect((await screen.findByRole('alert')).textContent).toBe('Please give the phase a name');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a name of only spaces', async () => {
    const onSubmit = renderForm();
    fireEvent.change(name(), { target: { value: '   ' } });
    save();

    expect((await screen.findByRole('alert')).textContent).toBe('Please give the phase a name');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed name', async () => {
    const onSubmit = renderForm();
    fireEvent.change(name(), { target: { value: '  Foundation  ' } });
    save();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Foundation', description: '' });
    });
  });
});
