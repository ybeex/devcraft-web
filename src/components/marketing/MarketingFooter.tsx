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

export function MarketingFooter() {
  return (
    <footer className="border-t border-rim-subtle bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <DevCraftMark size={28} />
              <span className="font-display text-base font-bold text-ink">DevCraft</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-dim">
              The last place you learn to code. Frontend and Backend engineering, taught with craft.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ghost">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-dim hover:text-ink">
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
          <div className="flex gap-4 text-xs text-ghost">
            <Link href="/legal/terms" className="hover:text-dim">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-dim">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
