/**
 * Scoring Module - Barrel Export
 *
 * @module scoring
 */

// Main service
export { calculateScores, toJobResult } from './scoring.service';

// Helper functions (for testing and direct use)
export {
  calculateQuestionScore,
  calculateRiskLevel,
  findMatchingProgramme,
  calculateDimensionScore,
  calculateOverallScore,
} from './helpers';
