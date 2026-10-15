import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusResult } from './StatusResult';

describe('StatusResult', () => {
  it('renders the icon in a static circle above the heading and description', () => {
    const { container } = render(
      <StatusResult icon="Search" title="Nothing here" description="Try another search." />
    );
    const circle = container.querySelector('.rounded-full');

    expect(circle?.className).toContain('h-16 w-16');
    expect(circle?.className).not.toContain('hover:scale-110');
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try another search.')).toBeTruthy();
  });

  it('places children between the description and the actions', () => {
    render(
      <StatusResult title="Done" description="All finished." actions={<button>Next</button>}>
        <p>Summary</p>
      </StatusResult>
    );
    const description = screen.getByText('All finished.');
    const summary = screen.getByText('Summary');
    const action = screen.getByRole('button', { name: 'Next' });

    expect(description.compareDocumentPosition(summary)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(summary.compareDocumentPosition(action)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders no circle without an icon', () => {
    const { container } = render(<StatusResult title="Unable to load" />);

    expect(container.querySelector('.rounded-full')).toBeNull();
  });
});
