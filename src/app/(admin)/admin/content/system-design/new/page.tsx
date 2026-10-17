'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ChallengeEditorForm } from '@/components/admin/content/ChallengeEditorForm'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

export default function NewChallengePage() {
  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <Link href="/admin/content/system-design" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink">
          <ArrowLeft size={13} /> Back to challenges
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">New challenge</h1>
        <p className="mt-1 text-sm text-dim">Add stages once the challenge itself is created.</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
        <ChallengeEditorForm />
      </motion.div>
    </motion.div>
  )
}
