'use client'

import { motion } from 'framer-motion'
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard'
import { XpGoalRing } from '@/components/dashboard/XpGoalRing'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ProjectProgress } from '@/components/dashboard/ProjectProgress'
import { CommunitySnippet } from '@/components/dashboard/CommunitySnippet'
import { VerifyEmailBanner } from '@/components/auth/VerifyEmailBanner'
import { useAuthStore } from '@/stores/auth-store'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.displayName.split(' ')[0] ?? 'there'

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-dim">Your learning at a glance.</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="empty:hidden">
        <VerifyEmailBanner />
      </motion.div>

      <motion.div variants={cascadeItem}>
        <ContinueLearningCard />
      </motion.div>

      <motion.div variants={cascadeItem}>
        <StatsGrid />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.div variants={cascadeItem} className="flex flex-col gap-6">
          <ActivityFeed />
        </motion.div>
        <motion.div variants={cascadeItem} className="flex flex-col gap-6">
          <XpGoalRing />
          <ProjectProgress />
          <CommunitySnippet />
        </motion.div>
      </div>
    </motion.div>
  )
}
