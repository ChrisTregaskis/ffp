import { AnimatePresence, motion, type Variants } from 'framer-motion';

export type CardTransitionDirection = 'forward' | 'backward';

export interface CardTransitionProps {
  /** Unique key for tracking the transition (e.g., 'step-1', 'credentials-step') */
  transitionKey: string;
  /** Content to animate */
  children: React.ReactNode;
  /** Animation duration in seconds @default 0.3 */
  duration?: number;
  /** Direction of transition @default 'forward' */
  direction?: CardTransitionDirection;
  /** Custom animation variants (optional - overrides direction) */
  variants?: Variants;
}

/**
 * Forward transition variants (left to right).
 *
 * Used when moving to the next step:
 * - Entry: Fade in with slide from right (20px)
 * - Exit: Fade out with slide to left (20px)
 */
const forwardVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Backward transition variants (right to left).
 *
 * Used when moving to the previous step:
 * - Entry: Fade in with slide from left (-20px)
 * - Exit: Fade out with slide to right (20px)
 */
const backwardVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Card transition wrapper component.
 *
 * Provides consistent animation for card-based transitions using Framer Motion.
 * Commonly used for multi-step forms, wizards, or any sequential card-based UI.
 *
 * Manages its own AnimatePresence internally, so you don't need to wrap it.
 *
 */
export const CardTransition: React.FC<CardTransitionProps> = ({
  transitionKey,
  children,
  duration = 0.15,
  direction = 'forward',
  variants,
}) => {
  // Use custom variants if provided, otherwise select based on direction
  const selectedVariants =
    variants ?? (direction === 'backward' ? backwardVariants : forwardVariants);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={selectedVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
