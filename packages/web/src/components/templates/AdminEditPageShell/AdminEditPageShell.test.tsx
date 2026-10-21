import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import { AdminEditPageShell } from './AdminEditPageShell';

import type { AdminEditPageShellProps } from './AdminEditPageShell';

interface ThingFormValues {
  name: string;
}

interface Thing {
  id: string;
  name: string;
}

const THING: Thing = { id: 'thing-1', name: 'Harbour Studio' };
const toFormValues = (thing: Thing): ThingFormValues => ({ name: thing.name });

const noSave = (): Promise<void> => Promise.resolve();

const EDIT_ONLY_PROPS: AdminEditPageShellProps<ThingFormValues, Thing> = {
  title: 'Edit Thing',
  resourceLabel: 'thing',
  listLabel: 'Things',
  isLoading: false,
  onBack: () => undefined,
  record: THING,
  toFormValues,
  onUpdate: noSave,
  children: null,
};

const ThingFields: React.FC = () => {
  const { register, errors } = useComposableFormContext<ThingFormValues>();

  return (
    <>
      <FormTextInput<ThingFormValues>
        name="name"
        label="Name"
        register={register}
        errors={errors}
      />
      <button type="submit">Save</button>
    </>
  );
};

// The data router builds a Request on every navigation, passing jsdom's AbortSignal to
// Node's fetch Request, which rejects a foreign signal from Node 24. Nothing here aborts
// a navigation, so the signal is dropped.
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

interface LoadState {
  isLoading?: boolean;
  loadError?: Error | null;
  record: Thing | undefined;
}

const renderShell = (props: AdminEditPageShellProps<ThingFormValues, Thing>): void => {
  const router = createMemoryRouter(
    [{ path: '/edit', element: <AdminEditPageShell<ThingFormValues, Thing> {...props} /> }],
    { initialEntries: ['/edit'] }
  );

  render(<RouterProvider router={router} />);
};

const renderEditOnly = ({ isLoading = false, loadError = null, record }: LoadState): void => {
  renderShell({
    ...EDIT_ONLY_PROPS,
    isLoading,
    loadError,
    record,
    beforeForm: <p>Thing preview</p>,
    children: <ThingFields />,
  });
};

describe('AdminEditPageShell edit-only mode', () => {
  it('renders the record into the form without any create props', () => {
    renderEditOnly({ record: THING });

    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Harbour Studio');
  });

  it('renders beforeForm above the form, outside it', () => {
    renderEditOnly({ record: THING });

    const preview = screen.getByText('Thing preview');
    const form = screen.getByLabelText('Name').closest('form');

    expect(form).not.toBeNull();
    expect(form?.contains(preview)).toBe(false);
    expect(
      preview.compareDocumentPosition(form as Node) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows neither beforeForm nor the form while the record loads', () => {
    renderEditOnly({ isLoading: true, record: undefined });

    expect(screen.queryByText('Thing preview')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  it('shows neither beforeForm nor the form when the record fails to load', () => {
    renderEditOnly({ loadError: new Error('Thing not found'), record: undefined });

    expect(screen.getByText('Unable to load thing')).toBeTruthy();
    expect(screen.getByText('Thing not found')).toBeTruthy();
    expect(screen.queryByText('Thing preview')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  // A failed background refetch keeps the record, so the user's edits stay on screen
  it('keeps the form and beforeForm when a refetch fails with the record in hand', () => {
    renderEditOnly({ loadError: new Error('Network error'), record: THING });

    expect(screen.getByText('Thing preview')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Harbour Studio');
  });

  // A query not yet fetching reports neither loading nor an error, and still has no record
  it('keeps the form unmounted while the record is missing without an error', () => {
    renderEditOnly({ record: undefined });

    expect(screen.queryByText('Unable to load thing')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });
});

describe('AdminEditPageShell create mode', () => {
  it('seeds the form from emptyValues and submits through onCreate', async () => {
    const onCreate = vi.fn(noSave);
    const onUpdate = vi.fn(noSave);

    renderShell({
      ...EDIT_ONLY_PROPS,
      isEditMode: false,
      emptyValues: { name: '' },
      onCreate,
      onUpdate,
      record: undefined,
      children: <ThingFields />,
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Harbour Studio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: 'Harbour Studio' });
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

// Stands in for a page whose deactivating edits ask first: a name ending "(closed)"
const closesThing = (values: ThingFormValues): boolean => values.name.endsWith('(closed)');

const ConfirmingThingPage: React.FC<{ onUpdate: (values: ThingFormValues) => Promise<void> }> = ({
  onUpdate,
}) => (
  <AdminEditPageShell<ThingFormValues, Thing>
    title="Edit Thing"
    resourceLabel="thing"
    listLabel="Things"
    isLoading={false}
    onBack={vi.fn()}
    record={THING}
    toFormValues={toFormValues}
    onUpdate={onUpdate}
    confirmBeforeSave={{
      when: closesThing,
      renderModal: ({ isOpen, onConfirm, onClose }) =>
        isOpen && (
          <div>
            <button type="button" onClick={onConfirm}>
              Confirm
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        ),
    }}
    beforeForm={<Link to="/things">Things</Link>}
  >
    <ThingFields />
  </AdminEditPageShell>
);

const renderConfirming = (
  onUpdate: (values: ThingFormValues) => Promise<void> = vi.fn(noSave)
): ReturnType<typeof createMemoryRouter> => {
  const router = createMemoryRouter(
    [
      { path: '/edit', element: <ConfirmingThingPage onUpdate={onUpdate} /> },
      { path: '/things', element: <p>Things list</p> },
    ],
    { initialEntries: ['/edit'] }
  );

  render(<RouterProvider router={router} />);

  return router;
};

const editAndSubmit = (name: string): void => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

const leaveViaLink = (): void => {
  fireEvent.click(screen.getByRole('link', { name: 'Things' }));
};

describe('AdminEditPageShell confirm before save', () => {
  it('holds an edit that matches the predicate until it is confirmed', async () => {
    const onUpdate = vi.fn(noSave);
    renderConfirming(onUpdate);

    editAndSubmit('Harbour Studio (closed)');
    await screen.findByRole('button', { name: 'Confirm' });

    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ name: 'Harbour Studio (closed)' });
    });
  });

  it('saves an edit that does not match the predicate straight through', async () => {
    const onUpdate = vi.fn(noSave);
    renderConfirming(onUpdate);

    editAndSubmit('Harbour Studio North');

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ name: 'Harbour Studio North' });
    });
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });

  it('marks the form saved once the confirmed save resolves', async () => {
    const router = renderConfirming();

    editAndSubmit('Harbour Studio (closed)');
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    });

    leaveViaLink();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/things');
    });
    expect(screen.queryByText('Unsaved Changes')).toBeNull();
  });

  it('saves nothing and keeps the form dirty and guarded when the confirm is cancelled', async () => {
    const onUpdate = vi.fn(noSave);
    const router = renderConfirming(onUpdate);

    editAndSubmit('Harbour Studio (closed)');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Harbour Studio (closed)');
  });
});
