import { describe, expect, it } from 'vitest';

import { assertUuidPathParam } from './assert-uuid-path-param';
import { ApiError } from './errors';

const UUID = '3ad90ada-14f9-4883-a502-56dc6cf73ab1';
const PUBLIC_ID = '5b22a43f5827';

describe('assertUuidPathParam', () => {
  it('returns a UUID unchanged', () => {
    expect(assertUuidPathParam(UUID, 'PUT /admin/locations/{id}')).toBe(UUID);
  });

  it('rejects a publicId, keeping the diagnostic out of the user-facing message', () => {
    expect(() => assertUuidPathParam(PUBLIC_ID, 'PUT /admin/locations/{id}')).toThrow(ApiError);

    try {
      assertUuidPathParam(PUBLIC_ID, 'PUT /admin/locations/{id}');
      expect.unreachable('the guard should have thrown');
    } catch (error) {
      expect(ApiError.isApiError(error)).toBe(true);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('INVALID_IDENTIFIER');

      // The banner copy must not leak the identifier or internal vocabulary
      expect((error as ApiError).message).not.toContain(PUBLIC_ID);
      expect((error as ApiError).message).not.toContain('publicId');

      // The diagnostic that names the caller still travels, on `details`
      const details = (error as ApiError).details as { endpoint: string; diagnostic: string };
      expect(details.endpoint).toBe('PUT /admin/locations/{id}');
      expect(details.diagnostic).toContain(PUBLIC_ID);
    }
  });

  it('rejects an empty identifier rather than calling with a trailing slash', () => {
    expect(() => assertUuidPathParam('', 'PUT /admin/users/{id}')).toThrow(ApiError);
  });
});
