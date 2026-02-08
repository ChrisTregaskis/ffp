/**
 * Shared animation timing constants for assessment screens and cards.
 *
 * Centralises duration and stagger values so they can be tweaked
 * globally from a single location.
 */
export const ASSESSMENT_MOTION = {
  /** Animation durations in seconds */
  duration: {
    /** Standard entrance animation (FadeSlideIn for cards/sections) */
    entrance: 0.5,
    /** Question-to-question transition (CardTransition) */
    questionTransition: 0.2,
  },
  /** Staggered entrance delays in seconds (sequential reveal order) */
  stagger: {
    first: 0,
    second: 0.15,
    third: 0.3,
    fourth: 0.5,
  },
} as const;
