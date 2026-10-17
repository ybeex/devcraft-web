'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { getAdminLesson } from '@/lib/api/admin'
import { LessonEditorForm } from '@/components/admin/content/LessonEditorForm'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

export default function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['admin-lesson-detail', id],
    queryFn: () => getAdminLesson(id),
  })

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        {lesson && (
          <Link
            href={`/admin/content/modules/${lesson.moduleId}/lessons`}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink"
          >
            <ArrowLeft size={13} /> Back to lessons
          </Link>
        )}
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Edit lesson</h1>
      </motion.div>

      <motion.div variants={cascadeItem}>
        {isLoading || !lesson ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-40 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          </div>
        ) : (
          <LessonEditorForm moduleId={lesson.moduleId} lessonId={lesson.id} initial={lesson} />
        )}
      </motion.div>
    </motion.div>
  )
}
