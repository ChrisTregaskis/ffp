import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useRef, useState } from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { useComposableFormContext } from '@web/components/form/composableForm';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

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

interface PendingConfirm {
  resolve: () => void;
  reject: (reason: Error) => void;
}

// Stands in for a page whose save asks first: onUpdate returns a promise the modal settles
const ConfirmingThingPage: React.FC<{ save: () => Promise<void> }> = ({ save }) => {
  const pendingRef = useRef<PendingConfirm | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleUpdate = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setIsConfirmOpen(true);
    });
  };

  const takePending = (): PendingConfirm | null => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setIsConfirmOpen(false);

    return pending;
  };

  const handleConfirm = (): void => {
    const pending = takePending();

    if (pending) {
      save().then(pending.resolve, pending.reject);
    }
  };

  const handleCancel = (): void => {
    takePending()?.reject(new Error('Cancelled'));
  };

  return (
    <AdminEditPageShell<ThingFormValues, Thing>
      title="Edit Thing"
      resourceLabel="thing"
      listLabel="Things"
      isLoading={false}
      onBack={vi.fn()}
      record={THING}
      toFormValues={toFormValues}
      onUpdate={handleUpdate}
      beforeForm={<Link to="/things">Things</Link>}
      footer={
        isConfirmOpen && (
          <div>
            <button type="button" onClick={handleConfirm}>
              Confirm
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )
      }
    >
      <ThingFields />
    </AdminEditPageShell>
  );
};

const renderConfirming = (
  save: () => Promise<void> = () => Promise.resolve()
): ReturnType<typeof createMemoryRouter> => {
  const router = createMemoryRouter(
    [
      { path: '/edit', element: <ConfirmingThingPage save={save} /> },
      { path: '/things', element: <p>Things list</p> },
    ],
    { initialEntries: ['/edit'] }
  );

  render(<RouterProvider router={router} />);

  return router;
};

const editAndSubmit = async (): Promise<void> => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Harbour Studio North' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await screen.findByRole('button', { name: 'Confirm' });
};

const leaveViaLink = (): void => {
  fireEvent.click(screen.getByRole('link', { name: 'Things' }));
};

describe('AdminEditPageShell save that asks first', () => {
  it('marks the form saved once the confirmed save resolves', async () => {
    const router = renderConfirming();

    await editAndSubmit();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    });

    leaveViaLink();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/things');
    });
    expect(screen.queryByText('Unsaved Changes')).toBeNull();
  });

  it('leaves the form dirty and guarded when the confirm is cancelled', async () => {
    const router = renderConfirming();

    await editAndSubmit();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Harbour Studio North');
  });

  it('leaves the form dirty and guarded when the confirmed save fails', async () => {
    const router = renderConfirming(() => Promise.reject(new Error('Save failed')));

    await editAndSubmit();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    });

    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');
  });

  it('holds a navigation while the confirm is open, rather than asking', async () => {
    const router = renderConfirming();

    await editAndSubmit();
    leaveViaLink();

    await waitFor(() => {
      expect(router.state.blockers.size).toBe(1);
    });
    expect(screen.queryByText('Unsaved Changes')).toBeNull();
    expect(router.state.location.pathname).toBe('/edit');
  });
});
