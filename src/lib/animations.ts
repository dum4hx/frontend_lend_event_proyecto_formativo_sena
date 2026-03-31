/**
 * Centralised Framer Motion animation presets.
 *
 * Changing these objects updates EVERY component that uses them —
 * no need to edit individual files.
 */

import type { Variants, Transition } from "framer-motion";

// ─── Default transition ────────────────────────────────────────────────────

export const defaultTransition: Transition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1],
};

// ─── Page transitions ──────────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

// ─── Modal transitions ────────────────────────────────────────────────────

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 5 },
};

export const modalTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

// ─── List stagger ──────────────────────────────────────────────────────────

export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

// ─── Fade-in helper ────────────────────────────────────────────────────────

export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ─── Slide-in from right (for side panels, drawers) ────────────────────────

export const slideInRightVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
};
