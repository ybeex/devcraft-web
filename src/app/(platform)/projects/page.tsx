'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { listProjects, type ProjectListItem } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/auth-store'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced']
const TRACK_OPTIONS = ['All tracks', 'Frontend', 'Backend']
const PAGE_SIZE = 18

function toApiDifficulty(label: string): ProjectListItem['difficulty'] | undefined {
  if (label === 'All') return undefined
  return label.toUpperCase() as ProjectListItem['difficulty']
}
const toApiTrack = (label: string): 'FE' | 'BE' | undefined => (label === 'Frontend' ? 'FE' : label === 'Backend' ? 'BE' : undefined)

export default function ProjectsPage() {
  const myTrack = useAuthStore((s) => s.user?.primaryTrack ?? null)
  const [difficultyLabel, setDifficultyLabel] = useState('All')
  // Start on the learner's own track, but let an explicit choice win over it.
  const [trackChoice, setTrackChoice] = useState<string | null>(null)
  const trackLabel = trackChoice ?? (myTrack === 'FE' ? 'Frontend' : myTrack === 'BE' ? 'Backend' : 'All tracks')
  const pick = (label: string) => setTrackChoice(label)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['projects', difficultyLabel, trackLabel],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listProjects({ page: pageParam, limit: PAGE_SIZE, difficulty: toApiDifficulty(difficultyLabel), track: toApiTrack(trackLabel) }),
    getNextPageParam: (last, pages) => (pages.flatMap((p) => p.projects).length < last.total ? pages.length + 1 : undefined),
  })

  const items = data?.pages.flatMap((p) => p.projects) ?? []
  const total = data?.pages[0]?.total ?? 0

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-dim">Build real things. Ship them. Put them in your portfolio.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SegmentedControl options={TRACK_OPTIONS} value={trackLabel} onChange={pick} />
          <SegmentedControl options={DIFFICULTY_OPTIONS} value={difficultyLabel} onChange={setDifficultyLabel} />
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-8">
          <EmptyState
            icon={<FeatureIcon name="projectRocket" size={56} achieved={false} />}
            headline="Couldn't load projects"
            body="Check your connection and try again."
            action={<Button variant="outline" onClick={() => void refetch()}>Retry</Button>}
          />
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<FeatureIcon name="projectRocket" size={56} achieved={false} />}
            headline="No projects match those filters"
            body="Try a different track or difficulty, or check back — new projects are added regularly."
            action={
              <Button variant="outline" onClick={() => { setDifficultyLabel('All'); pick('All tracks') }}>
                Show all projects
              </Button>
            }
          />
        </div>
      )}

      {items.length > 0 && (
        <>
          <p className="mt-6 text-xs text-ghost" data-testid="projects-count">Showing {items.length} of {total}</p>
          <motion.div
            key={`${difficultyLabel}-${trackLabel}`}
            variants={cascadeContainer}
            initial="initial"
            animate="animate"
            className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((project) => (
              <motion.div key={project.id} variants={cascadeItem}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} data-testid="projects-load-more">
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
