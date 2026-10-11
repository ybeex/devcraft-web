import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import type { CertificateWithHolder } from '@/lib/api/certificates'
import { FeatureIcon } from '@/components/brand/FeatureIcon'

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function CertificateView({ cert }: { cert: CertificateWithHolder }) {
  const trackName = cert.track === 'FE' ? 'Frontend Development' : 'Backend Development'
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mesh-bg flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-8 text-center shadow-elev-lg sm:p-12">
        <FeatureIcon name="certificate" size={64} className="mx-auto" />

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand">Certificate of Completion</p>
        <h1 className="font-display mt-3 text-2xl font-bold text-ink sm:text-3xl">{trackName}</h1>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-sm font-bold text-brand">
            {cert.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cert.user.avatar} alt={cert.user.displayName} className="h-full w-full object-cover" />
            ) : (
              initials(cert.user.displayName)
            )}
          </span>
          <div className="text-left">
            <p className="font-ui text-base font-bold text-ink">{cert.user.displayName}</p>
            <Link href={`/p/${cert.user.username}`} className="text-xs text-ghost hover:text-dim hover:underline">
              @{cert.user.username}
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-dim">Issued {issuedDate}</p>

        {(cert.metadata.modulesCompleted !== undefined || cert.metadata.lessonsCompleted !== undefined) && (
          <div className="mt-6 flex items-center justify-center gap-6 border-y border-rim-subtle py-4">
            {cert.metadata.modulesCompleted !== undefined && (
              <div>
                <p className="font-display text-xl font-bold text-ink">{cert.metadata.modulesCompleted}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Modules</p>
              </div>
            )}
            {cert.metadata.lessonsCompleted !== undefined && (
              <div>
                <p className="font-display text-xl font-bold text-ink">{cert.metadata.lessonsCompleted}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Lessons</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-success">
          <ShieldCheck size={14} /> Verified by DevCraft
        </div>
      </div>
    </div>
  )
}
