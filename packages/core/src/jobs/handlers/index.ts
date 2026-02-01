/**
 * Job Handlers
 *
 * Individual job type handlers for processing different job payloads.
 * Each handler is responsible for executing the business logic for its job type.
 *
 * @module jobs/handlers
 */

export { processScoreAssessment } from './score-assessment.handler';
export type { ScoreAssessmentJobPayload } from './score-assessment.handler';

export { processGenerateProgramme } from './generate-programme.handler';
export type { GenerateProgrammeJobPayload } from './generate-programme.handler';
