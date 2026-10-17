import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusResult } from './StatusResult';

describe('StatusResult', () => {
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

  it('renders the heading as a Title at the given level and colour', () => {
    render(<StatusResult title="Access Denied" titleAs="h5" titleColour="destructive" />);
    const heading = screen.getByRole('heading', { level: 5, name: 'Access Denied' });

    expect(heading.className).toContain('text-destructive');
  });
});
