import { AnimatePresence, motion, type Variants } from 'framer-motion';

export interface CardTransitionProps {
  /** Unique key for tracking the transition (e.g., 'step-1', 'credentials-step') */
  transitionKey: string;
  /** Content to animate */
  children: React.ReactNode;
  /** Animation duration in seconds @default 0.3 */
  duration?: number;
  /** Custom animation variants (optional) */
  variants?: Variants;
}

/**
 * Default card transition variants.
 *
 * Provides a subtle fade and horizontal slide effect:
 * - Entry: Fade in with slide from right (20px)
 * - Exit: Fade out with slide to left (20px)
 */
const defaultCardVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
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
  duration = 0.3,
  variants = defaultCardVariants,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={variants}
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
