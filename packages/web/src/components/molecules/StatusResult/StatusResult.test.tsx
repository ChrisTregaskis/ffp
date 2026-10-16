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

  it('renders the heading as a Title at the given level and colour', () => {
    render(<StatusResult title="Access Denied" titleAs="h5" titleColour="destructive" />);
    const heading = screen.getByRole('heading', { level: 5, name: 'Access Denied' });

    expect(heading.className).toContain('text-destructive');
  });

  it('sizes the circle with iconSize', () => {
    const { container } = render(<StatusResult icon="Check" iconSize="lg" title="Done" />);

    expect(container.querySelector('.rounded-full')?.className).toContain('h-14 w-14');
  });

  it('leaves the padding to its surroundings and narrows the copy when spaced as a feature', () => {
    const { container } = render(
      <StatusResult title="No programme" description="It will appear here." spacing="feature" />
    );

    expect(container.firstElementChild?.className).not.toContain('py-12');
    expect(screen.getByText('It will appear here.').className).toContain('max-w-sm');
  });

  it('sets small copy and full-width actions when compact', () => {
    render(
      <StatusResult
        title="Password reset"
        description="Sign in with your new password."
        spacing="compact"
        actions={<button>Back to sign in</button>}
      />
    );

    expect(screen.getByText('Sign in with your new password.').className).toContain('text-sm');
    expect(
      screen.getByRole('button', { name: 'Back to sign in' }).parentElement?.className
    ).toContain('w-full');
  });
});
