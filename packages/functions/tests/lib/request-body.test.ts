import { describe, expect, it } from 'vitest';

import { parseJsonBody } from '../../src/lib/request-body';

describe('parseJsonBody', () => {
  it('returns the parsed body', () => {
    expect(parseJsonBody('{"answers":{}}')).toEqual({ answers: {} });
  });

  it.each([
    ['a missing body', undefined, 'Request body is required'],
    ['an empty body', '', 'Request body is required'],
    ['a malformed body', '{"answers":', 'Invalid JSON in request body'],
  ])('refuses %s as a 400', (_case, body, message) => {
    expect(() => parseJsonBody(body)).toThrow(
      expect.objectContaining({ name: 'ValidationError', statusCode: 400, message }) as Error
    );
  });

  it('reads a missing body as empty when it is optional, and still refuses a malformed one', () => {
    expect(parseJsonBody(undefined, { required: false })).toEqual({});
    expect(() => parseJsonBody('{', { required: false })).toThrow('Invalid JSON in request body');
  });
});
