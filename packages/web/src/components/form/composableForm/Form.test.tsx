import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { FormTextInput } from '../standardForm/FormTextInput';

import { ComposableForm } from './Form';
import { useComposableFormContext } from './FormContext';

interface RecordFormValues {
  name: string;
  status: string;
}

const RecordFields: React.FC = () => {
  const { register, errors } = useComposableFormContext<RecordFormValues>();

  return (
    <>
      <FormTextInput<RecordFormValues>
        name="name"
        label="Name"
        register={register}
        errors={errors}
      />
      <FormTextInput<RecordFormValues>
        name="status"
        label="Status"
        register={register}
        errors={errors}
      />
      <button type="submit">Save</button>
    </>
  );
};

const renderForm = (
  values: RecordFormValues,
  onSubmit = vi.fn()
): { rerenderWith: (next: RecordFormValues) => void; onSubmit: typeof onSubmit } => {
  const { rerender } = render(
    <ComposableForm<RecordFormValues> onSubmit={onSubmit} values={values}>
      <RecordFields />
    </ComposableForm>
  );

  return {
    onSubmit,
    rerenderWith: (next) => {
      rerender(
        <ComposableForm<RecordFormValues> onSubmit={onSubmit} values={next}>
          <RecordFields />
        </ComposableForm>
      );
    },
  };
};

const input = (label: string): HTMLInputElement => screen.getByLabelText(label);

const STALE: RecordFormValues = { name: 'Harbour Studio', status: 'active' };
const FRESH: RecordFormValues = { name: 'Harbour Studio', status: 'inactive' };

describe('ComposableForm values', () => {
  it('re-seeds an untouched field when a refetch lands after mount', () => {
    const { rerenderWith } = renderForm(STALE);
    expect(input('Status').value).toBe('active');

    act(() => {
      rerenderWith(FRESH);
    });

    expect(input('Status').value).toBe('inactive');
  });

  it('keeps what the user typed when a refetch lands mid-edit', () => {
    const { rerenderWith } = renderForm(STALE);

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });

    act(() => {
      rerenderWith({ name: 'Harbour Studio (renamed elsewhere)', status: 'inactive' });
    });

    expect(input('Name').value).toBe('Harbour Studio North');
    expect(input('Status').value).toBe('inactive');
  });

  // The data-loss case: a form seeded from a cached record, saved after the fresh
  // one arrived, must submit the fresh status rather than write the stale one back
  it('submits the refreshed value for a field the user never touched', async () => {
    const { rerenderWith, onSubmit } = renderForm(STALE);

    act(() => {
      rerenderWith(FRESH);
    });

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'Harbour Studio North',
      status: 'inactive',
    });
  });

  // A field edited back to where it started is no longer dirty, so it takes the
  // refreshed value like any untouched field
  it('re-seeds a field typed into and then restored to its original value', () => {
    const { rerenderWith } = renderForm(STALE);

    fireEvent.change(input('Name'), { target: { value: 'Harbour' } });
    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio' } });

    act(() => {
      rerenderWith({ name: 'Harbour Studio (renamed elsewhere)', status: 'active' });
    });

    expect(input('Name').value).toBe('Harbour Studio (renamed elsewhere)');
  });

  it('does not reset on a refetch that returns an equal record', () => {
    const { rerenderWith } = renderForm(STALE);

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });

    act(() => {
      rerenderWith({ ...STALE });
    });

    expect(input('Name').value).toBe('Harbour Studio North');
  });
});

interface GuardedRecordPageProps {
  initialValues: RecordFormValues;
  onSubmit: (values: RecordFormValues) => unknown;
  exposeSetValues: (setValues: (next: RecordFormValues) => void) => void;
}

// Stands in for an edit page: query-seeded values, the guard on, and a way out
const GuardedRecordPage: React.FC<GuardedRecordPageProps> = ({
  initialValues,
  onSubmit,
  exposeSetValues,
}) => {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    exposeSetValues(setValues);
  }, [exposeSetValues]);

  return (
    <ComposableForm<RecordFormValues> onSubmit={onSubmit} values={values} guardUnsavedChanges>
      <RecordFields />
      <Link to="/preview">Preview</Link>
    </ComposableForm>
  );
};

const renderGuarded = (
  onSubmit: (values: RecordFormValues) => unknown = vi.fn()
): {
  router: ReturnType<typeof createMemoryRouter>;
  refetch: (next: RecordFormValues) => void;
} => {
  let setValues: (next: RecordFormValues) => void = () => undefined;

  const router = createMemoryRouter(
    [
      {
        path: '/edit',
        element: (
          <GuardedRecordPage
            initialValues={STALE}
            onSubmit={onSubmit}
            exposeSetValues={(set) => {
              setValues = set;
            }}
          />
        ),
      },
      { path: '/preview', element: <p>Preview page</p> },
    ],
    { initialEntries: ['/edit'] }
  );

  render(<RouterProvider router={router} />);

  return {
    router,
    refetch: (next) => {
      act(() => {
        setValues(next);
      });
    },
  };
};

const leaveViaLink = (): void => {
  fireEvent.click(screen.getByRole('link', { name: 'Preview' }));
};

// A save the test settles by hand, so it can act while the save is in flight
const pendingSave = (): {
  onSubmit: ReturnType<typeof vi.fn>;
  land: () => Promise<void>;
  fail: () => Promise<void>;
} => {
  const outcome = { land: (): void => undefined, fail: (): void => undefined };
  const onSubmit = vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        outcome.land = resolve;
        outcome.fail = () => {
          reject(new Error('Save failed'));
        };
      })
  );
  const settle = (how: 'land' | 'fail'): Promise<void> =>
    act(async () => {
      outcome[how]();
      await Promise.resolve();
    });

  return { onSubmit, land: () => settle('land'), fail: () => settle('fail') };
};

const editAndSave = async (onSubmit: ReturnType<typeof vi.fn>): Promise<void> => {
  fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
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

describe('ComposableForm unsaved changes guard', () => {
  beforeAll(() => {
    vi.stubGlobal('Request', SignalFreeRequest);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('lets an untouched form navigate away', async () => {
    const { router } = renderGuarded();

    leaveViaLink();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/preview');
    });
  });

  it('holds a navigation away from unsaved edits until the user chooses', async () => {
    const { router } = renderGuarded();

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });
    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));

    await waitFor(() => {
      expect(screen.queryByText('Unsaved Changes')).toBeNull();
    });
    expect(router.state.location.pathname).toBe('/edit');
    expect(input('Name').value).toBe('Harbour Studio North');

    leaveViaLink();
    fireEvent.click(await screen.findByRole('button', { name: 'Leave Without Saving' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/preview');
    });
  });

  // Re-seeding with keepDirtyValues briefly reports the form clean; the guard must not believe it
  it('still guards edits after a refetch lands mid-edit', async () => {
    const { router, refetch } = renderGuarded();

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });
    refetch(FRESH);

    expect(input('Name').value).toBe('Harbour Studio North');
    expect(input('Status').value).toBe('inactive');

    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');
  });

  // Mirrors a mutation's onSuccess: it navigates in the same tick the save resolves,
  // with no render in between
  it('lets a save navigate on success without asking', async () => {
    const onSuccessNavigate = { to: (): Promise<void> => Promise.resolve() };
    const onSubmit = vi.fn(() => onSuccessNavigate.to());
    const { router } = renderGuarded(onSubmit);

    onSuccessNavigate.to = () =>
      Promise.resolve().then(() => {
        void router.navigate('/preview');
      });

    fireEvent.change(input('Name'), { target: { value: 'Harbour Studio North' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/preview');
    });
    expect(screen.queryByText('Unsaved Changes')).toBeNull();
  });

  it('treats the form as saved once a returned save resolves', async () => {
    const save = pendingSave();
    const { router, refetch } = renderGuarded(save.onSubmit);

    await editAndSave(save.onSubmit);
    await save.land();

    // A clean form takes whatever the refetch brings, including a later edit made elsewhere
    refetch({ name: 'Harbour Studio West', status: 'active' });
    expect(input('Name').value).toBe('Harbour Studio West');

    leaveViaLink();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/preview');
    });
  });

  it('keeps guarding when a returned save rejects', async () => {
    const save = pendingSave();
    const { router, refetch } = renderGuarded(save.onSubmit);

    await editAndSave(save.onSubmit);
    await save.fail();

    refetch(FRESH);
    expect(input('Name').value).toBe('Harbour Studio North');

    leaveViaLink();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');
  });

  it('holds a navigation made mid-save, then asks if the save fails', async () => {
    const save = pendingSave();
    const { router } = renderGuarded(save.onSubmit);

    await editAndSave(save.onSubmit);
    leaveViaLink();

    // Held quietly while the outcome is unknown
    await waitFor(() => {
      expect(router.state.blockers.size).toBe(1);
    });
    expect(screen.queryByText('Unsaved Changes')).toBeNull();
    expect(router.state.location.pathname).toBe('/edit');

    await save.fail();

    expect(await screen.findByText('Unsaved Changes')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/edit');
    expect(input('Name').value).toBe('Harbour Studio North');
  });

  it('lets a navigation made mid-save go ahead once the save lands', async () => {
    const save = pendingSave();
    const { router } = renderGuarded(save.onSubmit);

    await editAndSave(save.onSubmit);
    leaveViaLink();
    await save.land();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/preview');
    });
  });

  it('keeps a re-seed that landed during the save once the save resolves', async () => {
    const save = pendingSave();
    const { refetch } = renderGuarded(save.onSubmit);

    await editAndSave(save.onSubmit);
    refetch(FRESH);
    await save.land();

    expect(input('Status').value).toBe('inactive');
    expect(input('Name').value).toBe('Harbour Studio North');
  });
});
