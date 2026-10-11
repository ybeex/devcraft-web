'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Users } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import type { ProjectListItem } from '@/lib/api/projects'
import { hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <motion.div {...hoverLift}>
      <Link
        href={`/projects/${project.id}`}
        className="flex h-full flex-col rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm transition-shadow hover:shadow-elev-md"
      >
        <div className="flex items-start justify-between gap-3">
          <FeatureIcon name="projectRocket" size={44} />
          <div className="flex items-center gap-2">
            {project.isPremium && (
              <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                Pro
              </span>
            )}
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', DIFFICULTY_STYLE[project.difficulty])}>
              {project.difficulty}
            </span>
          </div>
        </div>

        <h3 className="font-display mt-3.5 text-lg font-bold text-ink">{project.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-dim">{project.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-dim">
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-rim-subtle pt-3.5 text-xs text-ghost">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {project.estimatedHours}h
          </span>
          <span className="font-semibold text-brand">+{project.xpReward} XP</span>
        </div>
      </Link>
    </motion.div>
  )
}
