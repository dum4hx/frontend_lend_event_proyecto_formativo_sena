/**
 * AnimatedPage — Wraps page content with Framer Motion entrance / exit animations.
 *
 * Used inside layout components so every page automatically gets transitions.
 * Customisable via the `variants` and `transition` props, but defaults come
 * from the centralised `src/lib/animations.ts` file.
 */

import { motion, type Variants, type Transition } from "framer-motion";
import { pageVariants, pageTransition } from "../../lib/animations";

export interface AnimatedPageProps {
  /** Content to animate. */
  children: React.ReactNode;
  /** Override the default page variants. */
  variants?: Variants;
  /** Override the default transition. */
  transition?: Transition;
  /** Extra class names forwarded to the wrapper div. */
  className?: string;
}

/**
 * Wrap any routed page with this component to get fade+slide entrance
 * animations automatically.
 */
export function AnimatedPage({
  children,
  variants = pageVariants,
  transition = pageTransition,
  className,
}: AnimatedPageProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
