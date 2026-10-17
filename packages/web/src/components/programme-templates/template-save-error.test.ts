import { describe, expect, it } from 'vitest';

import { ApiError } from '@web/lib/api';

import { toTemplateSaveError } from './template-save-error';

describe('toTemplateSaveError', () => {
  it('explains a 409 as a taken slug', () => {
    const err = new ApiError(409, 'CONFLICT', "A programme template with slug 'a' already exists");

    expect(toTemplateSaveError(err)).toBe(
      'A template with this slug already exists. Please use a different slug.'
    );
  });

  it('passes any other failure through unchanged', () => {
    expect(toTemplateSaveError(new ApiError(400, 'VALIDATION_ERROR', 'Name is too long'))).toBe(
      'Name is too long'
    );
    expect(toTemplateSaveError(new Error('Network error'))).toBe('Network error');
  });
});
