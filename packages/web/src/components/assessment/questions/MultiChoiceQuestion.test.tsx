import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AssessmentQuestion } from '@ffp/core';

import { MultiChoiceQuestion } from './MultiChoiceQuestion';

const question: AssessmentQuestion = {
  id: '3ad90ada-14f9-4883-a502-56dc6cf73ab1',
  publicId: 'question0001',
  type: 'multi-choice',
  question: 'Which areas would you like to focus on?',
  options: [
    { value: 'neck', label: 'Neck and shoulders' },
    { value: 'back', label: 'Lower back' },
    { value: 'hips', label: 'Hips' },
  ],
  validation: { required: true, maxSelections: 2 },
};

const checkbox = (name: string): HTMLInputElement => screen.getByRole('checkbox', { name });

describe('MultiChoiceQuestion', () => {
  it('stops a selection beyond the cap, leaving the chosen options free to clear', () => {
    const onChange = vi.fn();

    render(
      <MultiChoiceQuestion question={question} value={['neck', 'back']} onChange={onChange} />
    );

    expect(checkbox('Hips').disabled).toBe(true);
    expect(checkbox('Neck and shoulders').disabled).toBe(false);

    fireEvent.click(checkbox('Hips'));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(checkbox('Lower back'));
    expect(onChange).toHaveBeenCalledWith(['neck']);
  });

  it('offers every option below the cap', () => {
    const onChange = vi.fn();

    render(<MultiChoiceQuestion question={question} value={['neck']} onChange={onChange} />);

    expect(checkbox('Hips').disabled).toBe(false);

    fireEvent.click(checkbox('Hips'));
    expect(onChange).toHaveBeenCalledWith(['neck', 'hips']);
  });

  it('drops a stored choice no longer offered on the next click, and ignores it for the cap', () => {
    const onChange = vi.fn();

    render(
      <MultiChoiceQuestion question={question} value={['neck', 'retired']} onChange={onChange} />
    );

    expect(checkbox('Hips').disabled).toBe(false);

    fireEvent.click(checkbox('Hips'));
    expect(onChange).toHaveBeenCalledWith(['neck', 'hips']);
  });
});
