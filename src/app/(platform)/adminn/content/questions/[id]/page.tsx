'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { getAdminQuestion } from '@/lib/api/admin'
import { QuestionEditorForm } from '@/components/admin/content/QuestionEditorForm'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: question, isLoading } = useQuery({
    queryKey: ['admin-question-detail', id],
    queryFn: () => getAdminQuestion(id),
  })

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <Link href="/admin/content/questions" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink">
          <ArrowLeft size={13} /> Back to questions
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Edit question</h1>
      </motion.div>

      <motion.div variants={cascadeItem}>
        {isLoading || !question ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-32 w-full rounded-[var(--radius-md)]" />
          </div>
        ) : (
          <QuestionEditorForm questionId={question.id} initial={question} />
        )}
      </motion.div>
    </motion.div>
  )
}
