import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AssessmentTemplateListItem, PaginatedAssessmentTemplateList } from '@ffp/core';

import { adminAssessmentTemplatesApi } from './admin-assessment-templates';

const template = (name: string): AssessmentTemplateListItem => ({
  id: crypto.randomUUID(),
  publicId: name.padEnd(12, 'x').slice(0, 12),
  name,
  description: null,
  version: 1,
  isActive: true,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  questionCount: 0,
  flowCount: 0,
});

const page = (
  data: AssessmentTemplateListItem[],
  pageNumber: number,
  totalPages: number
): PaginatedAssessmentTemplateList => ({
  data,
  pagination: { page: pageNumber, pageSize: 100, total: data.length, totalPages },
});

describe('adminAssessmentTemplatesApi.listAll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks every page of the list', async () => {
    const list = vi
      .spyOn(adminAssessmentTemplatesApi, 'list')
      .mockResolvedValueOnce(page([template('alpha')], 1, 2))
      .mockResolvedValueOnce(page([template('beta')], 2, 2));

    const result = await adminAssessmentTemplatesApi.listAll();

    expect(result.map((item) => item.name)).toEqual(['alpha', 'beta']);
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('stops after one request when the catalogue is empty', async () => {
    const list = vi.spyOn(adminAssessmentTemplatesApi, 'list').mockResolvedValue(page([], 1, 0));

    await expect(adminAssessmentTemplatesApi.listAll()).resolves.toEqual([]);
    expect(list).toHaveBeenCalledTimes(1);
  });
});
