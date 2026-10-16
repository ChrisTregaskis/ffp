import { describe, expect, it } from 'vitest';

import { ApiError } from './errors';

const QUESTION_ID = '3ad90ada-14f9-4883-a502-56dc6cf73ab1';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('ApiError.fromResponse', () => {
  it('reads the code from the body’s error field', async () => {
    const error = await ApiError.fromResponse(
      jsonResponse(400, { error: 'VALIDATION_ERROR', message: 'Some answers need your attention' })
    );

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Some answers need your attention');
    expect(error.isValidationError).toBe(true);
  });

  it('exposes per-field failures from details', async () => {
    const details = [
      {
        path: `answers.${QUESTION_ID}`,
        code: 'too_many_selections',
        message: 'Choose up to 2 options.',
      },
    ];
    const error = await ApiError.fromResponse(
      jsonResponse(400, { error: 'VALIDATION_ERROR', message: 'Invalid', details })
    );

    expect(error.fieldErrors).toEqual(details);
  });

  it('reports no field errors when details is not a field list', async () => {
    const error = await ApiError.fromResponse(
      jsonResponse(500, { error: 'INTERNAL_SERVER_ERROR', message: 'Oops', details: { a: 1 } })
    );

    expect(error.isValidationError).toBe(false);
    expect(error.fieldErrors).toEqual([]);
  });

  it('falls back to the status when the body is not JSON', async () => {
    const error = await ApiError.fromResponse(new Response('nope', { status: 502 }));

    expect(error.code).toBe('HTTP_502');
    expect(error.fieldErrors).toEqual([]);
  });
});
