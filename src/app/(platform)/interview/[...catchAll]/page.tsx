import { notFound } from 'next/navigation'

/**
 * Scoped under /interview — mirrors (platform)/dashboard's catch-all.
 * Coexists safely with the sibling [id] route (static > dynamic > catch-all).
 */
export default function InterviewCatchAll(): never {
  notFound()
}
