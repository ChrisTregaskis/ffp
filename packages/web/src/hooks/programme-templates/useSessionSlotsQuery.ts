import { useQuery } from '@tanstack/react-query';

import type { SessionSlotsResponse } from '@ffp/core';

import { adminSlotsApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseQueryResult } from '@tanstack/react-query';

/** Fetches a session's slots with their live pool sizes and warnings. */
export const useSessionSlotsQuery = (
  sessionId: string,
  enabled = true
): UseQueryResult<SessionSlotsResponse> => {
  return useQuery({
    queryKey: programmeTemplateKeys.sessionSlotList(sessionId),
    queryFn: () => adminSlotsApi.list(sessionId),
    // Pool sizes move with video and tag edits elsewhere, which don't invalidate this query
    staleTime: 0,
    enabled: enabled && !!sessionId,
  });
};
