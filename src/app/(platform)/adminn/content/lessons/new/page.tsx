'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { LessonEditorForm } from '@/components/admin/content/LessonEditorForm'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

function NewLessonPageContent() {
  const searchParams = useSearchParams()
  const moduleId = searchParams.get('moduleId')

  if (!moduleId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <p className="text-sm text-dim">
          Missing module. Go back and click "Add lesson" from a module's lesson list.
        </p>
        <Link href="/admin/content" className="mt-3 inline-block text-sm font-semibold text-brand underline">
          Back to content
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <Link
          href={`/admin/content/modules/${moduleId}/lessons`}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink"
        >
          <ArrowLeft size={13} /> Back to lessons
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">New lesson</h1>
      </motion.div>

      <motion.div variants={cascadeItem}>
        <LessonEditorForm moduleId={moduleId} />
      </motion.div>
    </motion.div>
  )
}

export default function NewLessonPage() {
  // useSearchParams (to read ?moduleId=) requires a Suspense boundary in the
  // App Router — matches the same pattern used in /admin/conflicts.
  return (
    <Suspense fallback={null}>
      <NewLessonPageContent />
    </Suspense>
  )
}
