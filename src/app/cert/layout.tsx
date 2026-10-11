import Link from 'next/link'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Certificate verification pages exist specifically for people without
 * DevCraft accounts to check (employers, recruiters) — same reasoning as
 * /p/layout.tsx, duplicated rather than shared since Next's layout system
 * is per route-subtree and this is ~10 lines of JSX.
 */
export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-rim-subtle px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <DevCraftMark size={30} />
          <span className="font-display text-lg font-bold text-ink">DevCraft</span>
        </Link>
      </header>
      {children}
    </div>
  )
}
