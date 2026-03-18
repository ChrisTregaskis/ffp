import { useQuery } from '@tanstack/react-query';

import type { ExerciseResponse } from '@ffp/core';

import { adminExercisesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryResult } from '@tanstack/react-query';

/** Fetches exercises for a session with embedded video summaries. */
export const useSessionExercisesQuery = (
  sessionId: string,
  enabled = true
): UseQueryResult<ExerciseResponse[]> => {
  return useQuery({
    queryKey: programmeTemplateKeys.sessionExerciseList(sessionId),
    queryFn: () => adminExercisesApi.list(sessionId),
    staleTime: minutesToMs(2),
    enabled: enabled && !!sessionId,
  });
};
