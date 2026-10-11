import Link from 'next/link'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Public-facing portfolios are viewed by people without accounts (employers,
 * recruiters), so this must not assume a logged-in session and must not live
 * inside (platform)'s sidebar shell. Unlike (auth)'s centered-card layout,
 * this is full-width — the content itself manages its own max-width.
 */
export default function PublicPortfolioLayout({ children }: { children: React.ReactNode }) {
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
