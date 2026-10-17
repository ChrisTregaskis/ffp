/**
 * Scoring Helpers - Barrel Export
 *
 * @module scoring/helpers
 */

export { calculateQuestionScore } from './question-scoring';
export { calculateRiskLevel, getCategoryFromScore } from './risk-level';
export {
  findMatchingMapping,
  findMatchingProgramme,
  type MatchedMapping,
} from './programme-matching';
export {
  buildQuestionMap,
  buildResponseMap,
  calculateDimensionScore,
  calculateOverallScore,
  formatDimensionName,
  type QuestionMap,
} from './dimension-scoring';
