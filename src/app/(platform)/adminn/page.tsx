'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Award, Activity, GitMerge } from 'lucide-react'
import { getLearnerFunnel, getTrackEngagement, getPendingConflictCount } from '@/lib/api/admin'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { KpiCard } from '@/components/admin/KpiCard'
import { FunnelSection } from '@/components/admin/FunnelSection'
import { TrackEngagementSection } from '@/components/admin/TrackEngagementSection'
import { AiUsageSection } from '@/components/admin/AiUsageSection'
import { ContentHealthSection } from '@/components/admin/ContentHealthSection'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const DAY_OPTIONS = { '7D': 7, '30D': 30, '90D': 90 } as const
type RangeLabel = keyof typeof DAY_OPTIONS

/**
 * Every query below shares its queryKey with the matching chart section
 * component (FunnelSection/TrackEngagementSection/AiUsageSection use the
 * exact same keys, AdminNav uses the exact same pending-conflicts key) —
 * TanStack Query dedupes identical in-flight/cached queries by key, so this
 * doesn't double-fetch. It just gives the KPI row its own numbers.
 */
export default function AdminOverviewPage() {
  const [rangeLabel, setRangeLabel] = useState<RangeLabel>('30D')
  const days = DAY_OPTIONS[rangeLabel]

  const { data: funnel } = useQuery({ queryKey: ['admin-funnel', days], queryFn: () => getLearnerFunnel(days) })
  const { data: tracks } = useQuery({ queryKey: ['admin-track-engagement', days], queryFn: () => getTrackEngagement(days) })
  const { data: pending } = useQuery({ queryKey: ['admin-pending-conflicts'], queryFn: getPendingConflictCount })

  const registered = funnel?.stages.find((s) => s.stage === 'Registered')?.count ?? 0
  const certified = funnel?.stages.find((s) => s.stage === 'Earned a certificate')?.count ?? 0
  const conversion = registered > 0 ? (certified / registered) * 100 : 0
  const activeLearners = tracks?.reduce((sum, t) => sum + t.activeLearners, 0) ?? 0
  const pendingCount = pending?.count ?? 0

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-dim">Funnel, engagement, and AI usage — the backend numbers finally have somewhere to live.</p>
        </div>
        <SegmentedControl
          options={Object.keys(DAY_OPTIONS)}
          value={rangeLabel}
          onChange={(v) => setRangeLabel(v as RangeLabel)}
        />
      </motion.div>

      <motion.div variants={cascadeItem} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={<Users size={20} />} value={registered} label="Registered" sublabel={`last ${days}d`} />
        <KpiCard icon={<Award size={20} />} value={certified} label="Certified" sublabel={`${conversion.toFixed(1)}% of registered`} />
        <KpiCard icon={<Activity size={20} />} value={activeLearners} label="Active learners" sublabel="across all tracks" />
        <KpiCard
          icon={<GitMerge size={20} />}
          value={pendingCount}
          label="Pending conflicts"
          sublabel={pendingCount > 0 ? 'needs review' : 'all clear'}
          tone={pendingCount > 0 ? 'warning' : 'default'}
        />
      </motion.div>

      <motion.div variants={cascadeItem} className="grid gap-5 lg:grid-cols-2">
        <FunnelSection days={days} />
        <TrackEngagementSection days={days} />
        <AiUsageSection days={days} />
        <ContentHealthSection />
      </motion.div>
    </motion.div>
  )
}
