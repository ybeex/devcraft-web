'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { getAdminModule, listAdminLessons, deleteAdminLesson, type ContentDifficulty } from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_TONE: Record<ContentDifficulty, string> = {
  BEGINNER: 'bg-success/15 text-success',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export default function ModuleLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = use(params)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: mod, isLoading: isModuleLoading } = useQuery({
    queryKey: ['admin-module-detail', moduleId],
    queryFn: () => getAdminModule(moduleId),
  })

  const { data: lessons, isLoading: areLessonsLoading, refetch } = useQuery({
    queryKey: ['admin-lessons', moduleId],
    queryFn: () => listAdminLessons(moduleId),
  })

  async function handleDelete(lessonId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return
    setDeletingId(lessonId)
    setDeleteError(null)
    try {
      await deleteAdminLesson(lessonId)
      await refetch()
    } catch {
      setDeleteError("Couldn't delete that lesson — try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <Link href="/admin/content" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink">
          <ArrowLeft size={13} /> Back to content
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              {isModuleLoading ? 'Lessons' : `${mod?.title} — Lessons`}
            </h1>
            <p className="mt-1 text-sm text-dim">
              {areLessonsLoading ? 'Loading…' : `${lessons?.length ?? 0} lesson${lessons?.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            href={`/admin/content/lessons/new?moduleId=${moduleId}`}
            className="btn-3d inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
          >
            <Plus size={15} /> Add lesson
          </Link>
        </div>
      </motion.div>

      <motion.div variants={cascadeItem} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {areLessonsLoading ? (
          <div className="p-5">
            <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />
          </div>
        ) : !lessons || lessons.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={<BookOpen size={56} strokeWidth={1.25} className="text-ghost" />}
              headline="No lessons yet"
              body="Add the first lesson for this module."
            />
          </div>
        ) : (
          <ul className="divide-y divide-rim-subtle">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    #{lesson.order} {lesson.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', DIFFICULTY_TONE[lesson.difficulty])}>
                      {lesson.difficulty}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', lesson.isPublished ? 'bg-success/15 text-success' : 'bg-raised text-dim')}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {lesson.isPremium && <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold text-dim">Premium</span>}
                    <span className="text-[11px] text-dim">{lesson.xpReward} XP · {lesson.estimatedMins}m</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/admin/content/lessons/${lesson.id}`}
                    className="flex items-center justify-center rounded-[var(--radius-sm)] px-2 py-1.5 text-ink transition-colors hover:bg-card"
                  >
                    <Pencil size={14} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-error hover:bg-error/10"
                    disabled={deletingId === lesson.id}
                    onClick={() => handleDelete(lesson.id, lesson.title)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {deleteError && <p className="text-sm font-medium text-error">{deleteError}</p>}
    </motion.div>
  )
}
