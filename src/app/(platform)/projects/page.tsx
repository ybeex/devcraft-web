'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { listProjects, type ProjectListItem } from '@/lib/api/projects'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced']

function toApiDifficulty(label: string): ProjectListItem['difficulty'] | undefined {
  if (label === 'All') return undefined
  return label.toUpperCase() as ProjectListItem['difficulty']
}

export default function ProjectsPage() {
  const [difficultyLabel, setDifficultyLabel] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', difficultyLabel],
    queryFn: () => listProjects({ limit: 20, difficulty: toApiDifficulty(difficultyLabel) }),
  })

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-dim">Build real things. Ship them. Put them in your portfolio.</p>
        </div>
        <SegmentedControl options={DIFFICULTY_OPTIONS} value={difficultyLabel} onChange={setDifficultyLabel} />
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      )}

      {!isLoading && data && data.projects.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<FeatureIcon name="projectRocket" size={56} achieved={false} />}
            headline="No projects match that filter"
            body="Try a different difficulty level, or check back — new projects are added regularly."
            action={
              <Button variant="outline" onClick={() => setDifficultyLabel('All')}>
                Show all projects
              </Button>
            }
          />
        </div>
      )}

      {!isLoading && data && data.projects.length > 0 && (
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          animate="animate"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {data.projects.map((project) => (
            <motion.div key={project.id} variants={cascadeItem}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
