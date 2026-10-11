import { notFound } from 'next/navigation'

/**
 * Scoped under /playground — mirrors (platform)/dashboard's catch-all.
 * Coexists safely with the static /playground/shared/[token] sibling
 * (static > dynamic > catch-all), same pattern as /community/new.
 */
export default function PlaygroundCatchAll(): never {
  notFound()
}
