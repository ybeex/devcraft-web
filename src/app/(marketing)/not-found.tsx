import { NotFoundIllustration } from '@/components/marketing/NotFoundIllustration'

/**
 * Reached via (marketing)/[...catchAll]/page.tsx calling notFound() — this
 * is a documented Next.js App Router quirk: a route-group not-found.tsx is
 * NOT invoked for genuinely unmatched top-level paths on its own, only when
 * something within that group's rendered tree explicitly calls notFound().
 * The catch-all route exists purely to trigger that. This file IS wrapped
 * by (marketing)/layout.tsx (header + footer) once reached that way.
 */
export default function MarketingNotFound() {
  return <NotFoundIllustration />
}
