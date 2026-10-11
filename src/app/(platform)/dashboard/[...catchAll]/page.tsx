import { notFound } from 'next/navigation'

/**
 * Scoped under /dashboard specifically (not a blanket (platform)-wide
 * catch-all) — a blanket [...catchAll] here would collide with
 * (marketing)'s own top-level catch-all, since route groups don't appear
 * in the URL and both would resolve to the same path space. This catches
 * unmatched sub-paths like /dashboard/anything-invalid, triggering
 * (platform)/not-found.tsx with the sidebar shell intact.
 *
 * As other (platform) segments (learn, projects, interview, community,
 * leaderboard, playground) gain real content in a later build phase, add a
 * matching scoped catch-all under each — e.g.
 * (platform)/projects/[...catchAll]/page.tsx — rather than trying to
 * reintroduce a blanket one.
 */
export default function DashboardCatchAll(): never {
  notFound()
}
