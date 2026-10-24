import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '@web/components/atoms';

describe('ClickScale', () => {
  it('adds no tab stop of its own: one Tab moves from one Button to the next', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>Cancel</Button>
        <Button>Save</Button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
  });
});
