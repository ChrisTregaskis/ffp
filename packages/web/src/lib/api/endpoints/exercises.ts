import {
  toggleExerciseCompletionResponseSchema,
  type ToggleExerciseCompletionResponse,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/exercises';

/**
 * Exercise completion API methods
 */
export const exercisesApi = {
  /**
   * Toggle exercise completion status (completed/uncompleted)
   * Returns the updated completion record and cascade results
   */
  toggleCompletion: async (
    completionId: string,
    completed: boolean
  ): Promise<ToggleExerciseCompletionResponse> => {
    const path = `${basePath}/${completionId}/complete`;
    const response = await ffpClient.put(path, { completed });

    return parseApiResponse(toggleExerciseCompletionResponseSchema, response, {
      method: 'PUT',
      path,
    });
  },
};

// Re-export types for consumers
export type { ToggleExerciseCompletionResponse };
