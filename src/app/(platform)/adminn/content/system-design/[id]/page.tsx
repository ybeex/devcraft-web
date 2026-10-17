'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAdminChallenge, deleteAdminChallenge } from '@/lib/api/admin'
import { ChallengeEditorForm } from '@/components/admin/content/ChallengeEditorForm'
import { StageList } from '@/components/admin/content/StageList'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

export default function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: challenge, isLoading, refetch } = useQuery({
    queryKey: ['admin-challenge-detail', id],
    queryFn: () => getAdminChallenge(id),
  })

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!challenge) return
    if (!window.confirm(`Delete "${challenge.title}" and all its stages? This can't be undone.`)) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteAdminChallenge(id)
      router.push('/admin/content/system-design')
    } catch {
      setDeleteError("Couldn't delete this challenge — try again.")
      setIsDeleting(false)
    }
  }

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {isLoading ? 'Edit challenge' : challenge?.title}
          </h1>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting || isLoading}>
            <Trash2 size={14} /> {isDeleting ? 'Deleting…' : 'Delete challenge'}
          </Button>
        </div>
      </motion.div>

      {deleteError && <p className="text-sm font-medium text-error">{deleteError}</p>}

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
        {isLoading || !challenge ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-24 w-full rounded-[var(--radius-md)]" />
          </div>
        ) : (
          <ChallengeEditorForm challengeId={challenge.id} initial={challenge} />
        )}
      </motion.div>

      <motion.div variants={cascadeItem}>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Stages</h2>
        {isLoading ? <Skeleton className="h-20 w-full rounded-[var(--radius-md)]" /> : <StageList challengeId={id} />}
      </motion.div>
    </motion.div>
  )
}
