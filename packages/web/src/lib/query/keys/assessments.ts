/**
 * Assessment Query Key Factory
 *
 * @description Hierarchical query keys for efficient cache invalidation.
 * Uses the factory pattern recommended by TanStack Query.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const assessmentKeys = {
  /** Base key for all assessment queries */
  all: ['assessments'] as const,

  /** All flow queries */
  flows: () => [...assessmentKeys.all, 'flows'] as const,

  /** Specific flow by ID */
  flow: (flowId: string) => [...assessmentKeys.flows(), flowId] as const,

  /** All template queries */
  templates: () => [...assessmentKeys.all, 'templates'] as const,

  /** Specific template by ID */
  template: (templateId: string) => [...assessmentKeys.templates(), templateId] as const,

  /** All user assessment queries */
  userAssessments: () => [...assessmentKeys.all, 'userAssessments'] as const,

  /** Specific user assessment */
  userAssessment: (assessmentId: string) =>
    [...assessmentKeys.userAssessments(), assessmentId] as const,

  /** Results for a specific assessment */
  results: (assessmentId: string) =>
    [...assessmentKeys.userAssessment(assessmentId), 'results'] as const,

  /** Current user's assessment/programme status */
  userStatus: () => [...assessmentKeys.all, 'userStatus'] as const,
};
