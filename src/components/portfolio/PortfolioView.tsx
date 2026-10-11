import Link from 'next/link'
import { Github, Globe, Linkedin, ExternalLink, Flame, Trophy } from 'lucide-react'
import type { PublicPortfolio } from '@/lib/api/portfolio'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { ActivityHeatmap } from './ActivityHeatmap'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function PortfolioView({ data }: { data: PublicPortfolio }) {
  const { user, portfolio, stats, certificates, projects } = data
  const trackColor = user.primaryTrack === 'FE' ? 'var(--track-fe)' : user.primaryTrack === 'BE' ? 'var(--track-be)' : undefined
  const skillLabels = portfolio.skills.filter((s): s is string => typeof s === 'string')
  const memberSince = new Date(user.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mesh-bg border-b border-rim-subtle px-6 py-14 sm:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-2xl font-bold text-brand shadow-elev-md sm:h-28 sm:w-28">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              initials(user.displayName)
            )}
          </span>

          <h1 className="font-display mt-5 text-3xl font-bold text-ink sm:text-4xl">{user.displayName}</h1>
          <p className="mt-1 text-sm text-ghost">
            @{user.username} · Building since {memberSince}
          </p>

          {portfolio.headline && <p className="mt-3 max-w-xl text-base text-dim">{portfolio.headline}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {user.primaryTrack && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
              >
                {user.primaryTrack === 'FE' ? 'Frontend' : 'Backend'}
              </span>
            )}
            {portfolio.githubUrl && (
              <a
                href={portfolio.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-rim bg-card px-3.5 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
              >
                <Github size={13} /> GitHub
              </a>
            )}
            {portfolio.linkedinUrl && (
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-rim bg-card px-3.5 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
              >
                <Linkedin size={13} /> LinkedIn
              </a>
            )}
            {portfolio.websiteUrl && (
              <a
                href={portfolio.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-rim bg-card px-3.5 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
              >
                <Globe size={13} /> Website
              </a>
            )}
          </div>

          <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBlock label="Level" value={String(user.level)} />
            <StatBlock label="XP" value={user.xp.toLocaleString()} />
            <StatBlock label="Streak" value={`${user.currentStreak}d`} icon={<Flame size={14} className="text-warning" />} />
            <StatBlock label="Projects" value={String(stats.projectsBuilt)} />
          </div>

          {certificates.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {certificates.map((cert) => (
                <Link
                  key={cert.id}
                  href={`/cert/${cert.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-rim-subtle bg-card px-4 py-3 shadow-elev-sm transition-shadow hover:shadow-elev-md"
                >
                  <FeatureIcon name="certificate" size={36} />
                  <div className="text-left">
                    <p className="font-ui text-sm font-bold text-ink">
                      {cert.track === 'FE' ? 'Frontend' : 'Backend'} Certified
                    </p>
                    <p className="text-xs text-ghost">
                      {new Date(cert.issuedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} · Verify →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {portfolio.bio && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-dim">{portfolio.bio}</p>
          </div>
        )}

        {skillLabels.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {skillLabels.map((skill) => (
              <span key={skill} className="rounded-full bg-raised px-3 py-1 text-xs font-medium text-dim">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ghost">
          <Trophy size={13} /> {stats.lessonsCompleted} lessons completed
        </div>

        <div className="mt-8">
          <ActivityHeatmap activity={data.activityHeatmap} />
        </div>

        {projects.length > 0 ? (
          <div className="mt-12">
            <h2 className="font-display text-center text-xl font-bold text-ink">Projects</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {projects.map((project) => (
                <PortfolioProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center gap-3 py-8 text-center">
            <FeatureIcon name="projectRocket" size={48} achieved={false} />
            <p className="text-sm text-ghost">No projects submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-4 shadow-elev-sm">
      <span className="flex items-center gap-1 font-display text-xl font-bold text-ink">
        {icon}
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">{label}</span>
    </div>
  )
}

function PortfolioProjectCard({ project }: { project: PublicPortfolio['projects'][number] }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-ui text-base font-bold text-ink">{project.title}</h3>
        {project.avgScore !== null && <span className="shrink-0 font-ui text-sm font-bold text-brand">{project.avgScore}/100</span>}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            DIFFICULTY_STYLE[project.difficulty]
          )}
        >
          {project.difficulty}
        </span>
        {project.techStack.slice(0, 4).map((tech) => (
          <span key={tech} className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-dim">
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-3">
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink"
          >
            <Github size={13} /> Code
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink"
          >
            <ExternalLink size={13} /> Live
          </a>
        )}
      </div>
    </div>
  )
}
