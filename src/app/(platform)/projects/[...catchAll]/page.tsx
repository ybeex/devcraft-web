import { notFound } from 'next/navigation'

/**
 * Scoped under /projects specifically — mirrors (platform)/dashboard's
 * catch-all exactly (see that file's comment for the full rationale).
 * Catches unmatched sub-paths like /projects/abc/def, triggering
 * (platform)/not-found.tsx with the sidebar shell intact. Coexists safely
 * with the sibling [id] route: Next.js resolves static > dynamic > catch-all,
 * so a single-segment /projects/:id always matches [id] first.
 */
export default function ProjectsCatchAll(): never {
  notFound()
}
