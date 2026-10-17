'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { QuestionEditorForm } from '@/components/admin/content/QuestionEditorForm'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

export default function NewQuestionPage() {
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
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">New question</h1>
      </motion.div>

      <motion.div variants={cascadeItem}>
        <QuestionEditorForm />
      </motion.div>
    </motion.div>
  )
}
