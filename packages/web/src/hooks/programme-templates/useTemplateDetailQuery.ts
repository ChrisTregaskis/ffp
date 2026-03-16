import { useQuery } from '@tanstack/react-query';

import type { TemplateDetailResponse } from '@ffp/core';

import { adminProgrammeTemplatesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single programme template with full hierarchy (phases > sessions > exercises). */
export const useTemplateDetailQuery = (
  templateId: string,
  options?: Omit<UseQueryOptions<TemplateDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<TemplateDetailResponse> => {
  return useQuery({
    queryKey: programmeTemplateKeys.detail(templateId),
    queryFn: () => adminProgrammeTemplatesApi.get(templateId),
    enabled: !!templateId,
    staleTime: minutesToMs(2),
    ...options,
  });
};
