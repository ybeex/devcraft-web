'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Reached via (platform)/dashboard/[...catchAll]/page.tsx calling
 * notFound() — same Next.js App Router quirk as the marketing pair (see
 * that catch-all's comment for the full explanation). Scoped under
 * /dashboard specifically since a blanket (platform)-wide catch-all would
 * collide with (marketing)'s own top-level one. This file IS wrapped by
 * (platform)/layout.tsx (sidebar + top bar stay intact) once reached that way.
 *
 * Treated as an empty state, not a special page (Design Philosophy §14) —
 * calm and in-context, never breaks the shell around it.
 */
export default function PlatformNotFound() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <EmptyState
        icon={<DevCraftMark size={64} className="opacity-40 grayscale" />}
        headline="This page wandered off the curriculum"
        body="The lesson or page you're looking for doesn't exist anymore, or the link was off by a typo."
        action={
          <Link href="/dashboard">
            <Button>Back to your dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
