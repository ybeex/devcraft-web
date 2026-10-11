'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const STATS = [
  { value: 12400, suffix: '+', label: 'Learners' },
  { value: 200, suffix: '+', label: 'Lessons' },
  { value: 48, suffix: '', label: 'Real-world projects' },
  { value: 49, suffix: '', label: 'Avg rating', decimals: 1, divisor: 10 },
]

function StatItem({ stat, inView }: { stat: (typeof STATS)[number]; inView: boolean }) {
  const target = inView ? stat.value : 0
  const animated = useCountUp(target, 1200)
  const display = stat.divisor ? (animated / stat.divisor).toFixed(stat.decimals ?? 0) : animated.toLocaleString()

  return (
    <motion.div variants={cascadeItem} className="text-center">
      <div className="font-display text-4xl font-bold text-ink sm:text-5xl">
        {display}
        {stat.suffix}
      </div>
      <div className="mt-1 text-sm text-dim">{stat.label}</div>
    </motion.div>
  )
}

export function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="border-y border-rim-subtle bg-card py-12">
      <motion.div
        ref={ref}
        variants={cascadeContainer}
        initial="initial"
        animate={inView ? 'animate' : 'initial'}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4"
      >
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} inView={inView} />
        ))}
      </motion.div>
    </section>
  )
}
