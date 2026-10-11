import Link from 'next/link'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Deliberately minimal — no MarketingHeader/Footer. A person mid-signup
 * shouldn't be one misclick away from wandering off to /pricing. The only
 * way out is the logo link back to the marketing home.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-bg mesh-animate flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <DevCraftMark size={36} />
        <span className="font-display text-xl font-bold text-ink">DevCraft</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
