import Link from 'next/link'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { href: '/fe', label: 'Frontend track' },
      { href: '/be', label: 'Backend track' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/legal/terms', label: 'Terms of service' },
      { href: '/legal/privacy', label: 'Privacy policy' },
    ],
  },
]

const linkClass =
  'relative inline-block text-sm text-dim transition-colors hover:text-ink after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-gradient-to-r after:from-[var(--brand)] after:to-[var(--brand-2)] after:transition-all after:duration-300 hover:after:w-full'

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-rim-subtle bg-card">
      <div aria-hidden className="divider-glow absolute inset-x-0 top-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_120%_at_50%_0%,var(--glow),transparent_62%)] opacity-[0.5]"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="transition-transform duration-300 group-hover:scale-110">
                <DevCraftMark size={28} />
              </span>
              <span className="font-display text-base font-bold text-ink">DevCraft</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-dim">
              The last place you learn to code. Frontend and Backend engineering, taught with craft.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-ghost">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success pulse-ring" aria-hidden />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              All systems operational
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ghost">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-rim-subtle pt-8 sm:flex-row">
          <p className="text-xs text-ghost">© {new Date().getFullYear()} DevCraft. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/terms" className={linkClass}>
              Terms
            </Link>
            <Link href="/legal/privacy" className={linkClass}>
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
