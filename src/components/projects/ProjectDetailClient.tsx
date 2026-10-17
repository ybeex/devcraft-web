'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Lock } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrustBanner, GuidanceCard } from '@/components/ui/TrustBanner'
import { Button } from '@/components/ui/Button'
import { ProjectStages } from './ProjectStages'
import { ProjectSubmitForm } from './ProjectSubmitForm'
import { SubmissionStatusCard } from './SubmissionStatusCard'
import { getProject, getMySubmissions } from '@/lib/api/projects'
import { ApiRequestError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export function ProjectDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [justSubmitted, setJustSubmitted] = useState(false)

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
    retry: (count, err) => !(err instanceof ApiRequestError && err.statusCode === 404) && count < 2,
  })

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: getMySubmissions,
  })

  const mySubmission = useMemo(
    () => submissions?.find((s) => s.project.id === id) ?? null,
    [submissions, id]
  )

  if (projectLoading || submissionsLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-9 w-2/3" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-6 h-56 w-full rounded-[var(--radius-xl)]" />
      </div>
    )
  }

  if (projectError) {
    if (projectError instanceof ApiRequestError && projectError.statusCode === 404) notFound()
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-sm text-dim">Couldn&rsquo;t load this project. Try refreshing the page.</p>
      </div>
    )
  }

  if (!project) return null

  const tierLocked = project.isPremium && user?.tier === 'FREE'

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> All projects
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="mt-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <FeatureIcon name="projectRocket" size={52} />
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{project.title}</h1>
              {project.module && (
                <p className="mt-1 text-sm text-dim">
                  {project.module.track.name} · {project.module.title}
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
              DIFFICULTY_STYLE[project.difficulty]
            )}
          >
            {project.difficulty}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-dim">{project.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ghost">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {project.estimatedHours}h estimated
          </span>
          <span className="font-semibold text-brand">+{project.xpReward} XP</span>
          <span>
            {project.submissionCount} builder{project.submissionCount === 1 ? '' : 's'} submitted
          </span>
        </div>

        {project.techStack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span key={tech} className="rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-dim">
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.requirements.length > 0 && (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5">
            <h3 className="font-ui text-sm font-semibold text-ink">Requirements</h3>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm text-dim">
              {project.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {project.outcomes?.length > 0 && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5" data-testid="project-outcomes">
            <h3 className="font-ui text-sm font-semibold text-ink">What you will practise</h3>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm text-dim">
              {project.outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {project.stages.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">Build stages</h2>
            <div className="mt-4">
              <ProjectStages stages={project.stages} />
            </div>
          </div>
        )}

        <div className="mt-8">
          {tierLocked ? (
            <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6">
              <TrustBanner icon={<Lock />} tone="info">
                This is a Pro project. Upgrade to submit your build and get AI + peer review.
              </TrustBanner>
              <Link href="/pricing" className="mt-4 block">
                <Button className="w-full justify-center">View Pro plans</Button>
              </Link>
            </div>
          ) : justSubmitted ? (
            <GuidanceCard
              icon={<FeatureIcon name="community" size={28} />}
              title="What's next?"
              body="Peer reviewers usually respond within a couple of days. The AI review lands almost immediately — check back on this page to see it."
            />
          ) : mySubmission ? (
            <>
              <h2 className="font-display text-xl font-bold text-ink">Your submission</h2>
              <div className="mt-4">
                <SubmissionStatusCard submission={mySubmission} />
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-ink">Submit your build</h2>
              <div className="mt-4">
                <ProjectSubmitForm
                  projectId={id}
                  onSubmitted={() => {
                    setJustSubmitted(true)
                    queryClient.invalidateQueries({ queryKey: ['my-submissions'] })
                  }}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
