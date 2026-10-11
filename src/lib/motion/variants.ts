import type { Transition, Variants } from 'framer-motion'

// ─── Easing ────────────────────────────────────────────────────────────────────

export const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const easeSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
}

// ─── 1. Page transition — direction-aware slide + fade ────────────────────────
// Forward navigation enters from the right, back navigation enters from the left.
// Never fade-only between routes — direction is a hierarchy cue.

export function pageTransition(direction: 'forward' | 'back' = 'forward'): Variants {
  const x = direction === 'forward' ? 16 : -16
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: easeOut } },
    exit: { opacity: 0, x: -x, transition: { duration: 0.18, ease: 'easeIn' } },
  }
}

// ─── 2. Cascade — staggered entrance for lists/grids ──────────────────────────
// A single element never staggers against itself. Cap stagger at 6 items.

export const cascadeContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const cascadeItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
}

// ─── 3. Reward pulse — reserved for exactly 4 moments app-wide:────────────────
// lesson XP award, streak increment, certificate unlock, leaderboard rank-up.
// If a 5th use case appears, it isn't actually a "reward" — use cascadeItem instead.

export const rewardPulse: Variants = {
  initial: { scale: 0.6, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: easeSpring },
}

// ─── Hover lift — interactive cards translate, never scale ────────────────────
// Translate reads as "this lifted toward you" (correct physical metaphor for a
// raised surface). Scale reads as "this got bigger" (wrong metaphor).

export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { y: 0, transition: { duration: 0.08 } },
}

// ─── Mesh-gradient ambient drift (hero backgrounds) ───────────────────────────

export const meshDrift: Variants = {
  animate: {
    transform: [
      'translate(0px, 0px)',
      'translate(18px, -14px)',
      'translate(-14px, 10px)',
      'translate(0px, 0px)',
    ],
    transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Brand mark 3D spin (loaders, 404 pages) ──────────────────────────────────

export const markSpin: Variants = {
  animate: {
    rotateY: [0, 360],
    transition: { duration: 1.4, repeat: Infinity, ease: 'linear' },
  },
}

export const markWobble: Variants = {
  animate: {
    rotateY: [0, 15, -15, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}
