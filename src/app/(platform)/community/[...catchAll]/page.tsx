import { notFound } from 'next/navigation'

/**
 * Scoped under /community — mirrors (platform)/dashboard's catch-all.
 * Coexists safely with the static /community/new and dynamic
 * /community/[id] siblings: Next.js resolves static > dynamic > catch-all.
 */
export default function CommunityCatchAll(): never {
  notFound()
}
