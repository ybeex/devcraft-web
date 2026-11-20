import Link from 'next/link'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Deliberately minimal — no MarketingHeader/Footer. A person mid-signup
 * shouldn't be one misclick away from wandering off to /pricing. The only
 * way out is the logo link back to the marketing home.
 *
 * Styled with the same "Crafted Depth" atmosphere as the marketing pages
 * (aurora mesh + film grain + a radially-faded hairline grid) so the signup
 * flow feels like the same premium product, not a bolted-on form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="aurora aurora-animate grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* hairline grid, radially masked for depth */}
      <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-50" />

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
