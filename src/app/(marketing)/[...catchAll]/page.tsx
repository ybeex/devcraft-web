import { notFound } from 'next/navigation'

/**
 * Exists solely to trigger (marketing)/not-found.tsx with (marketing)/layout.tsx's
 * header/footer chrome intact. Without this catch-all, a genuinely unmatched
 * top-level path (e.g. /some-random-typo) would fall through to the plain
 * root app/not-found.tsx instead — a documented Next.js App Router quirk
 * where route-group not-found.tsx files only activate when something within
 * that group's tree explicitly calls notFound(), not for paths Next can't
 * match into any segment at all.
 */
export default function MarketingCatchAll(): never {
  notFound()
}
