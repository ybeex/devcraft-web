'use client'

import { useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { linkVertical } from 'd3'
import { ModuleNode } from './ModuleNode'
import { LessonRow } from './LessonRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { getTrackCurriculum } from '@/lib/api/curriculum'
import { getBulkLessonStatus } from '@/lib/api/progress'
import { computeModuleStates, computeLessonStates } from '@/lib/utils/curriculum-tree'
import { cascadeItem } from '@/lib/motion/variants'

interface ConnectorPath {
  d: string
  completed: boolean
}

export function CurriculumTree({ track }: { track: 'FE' | 'BE' }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [connectors, setConnectors] = useState<ConnectorPath[]>([])

  const { data: curriculum, isLoading: loadingCurriculum } = useQuery({
    queryKey: ['curriculum-track', track],
    queryFn: () => getTrackCurriculum(track),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ['bulk-lesson-status', track],
    queryFn: () => getBulkLessonStatus(track),
  })

  const moduleStates = useMemo(
    () => (curriculum && statuses ? computeModuleStates(curriculum.modules, statuses) : []),
    [curriculum, statuses],
  )

  const toggleModule = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Measures each module card's real rendered position and computes a
  // D3 bezier connector between consecutive cards — this is the one place
  // D3 is used in DevCraft, per the design system's data-viz division of
  // labor (Recharts for standard charts, D3 for this custom node diagram).
  // Recomputed whenever the expanded set changes, since expanding a module
  // shifts every card below it.
  useLayoutEffect(() => {
    if (!containerRef.current || moduleStates.length < 2) {
      setConnectors((current) => (current.length === 0 ? current : []))
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()

    interface NodePoint { x: number; y: number }
    interface LinkDatum { source: NodePoint; target: NodePoint }

    const generator = linkVertical<unknown, LinkDatum, NodePoint>()
      .x((d) => d.x)
      .y((d) => d.y)

    const paths: ConnectorPath[] = []
    for (let i = 0; i < moduleStates.length - 1; i++) {
      const currentMod = moduleStates[i]
      const nextMod = moduleStates[i + 1]
      if (!currentMod || !nextMod) continue

      const currentEl = nodeRefs.current.get(currentMod.module.id)
      const nextEl = nodeRefs.current.get(nextMod.module.id)
      if (!currentEl || !nextEl) continue

      const currentRect = currentEl.getBoundingClientRect()
      const nextRect = nextEl.getBoundingClientRect()

      const source: NodePoint = {
        x: currentRect.left - containerRect.left + currentRect.width / 2,
        y: currentRect.bottom - containerRect.top,
      }
      const target: NodePoint = {
        x: nextRect.left - containerRect.left + nextRect.width / 2,
        y: nextRect.top - containerRect.top,
      }

      const d = generator({ source, target })
      if (d) paths.push({ d, completed: currentMod.state === 'completed' })
    }

    setConnectors(paths)
  }, [moduleStates, expandedIds])

  if (loadingCurriculum || loadingStatuses) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-5 py-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-xl)]" />
        ))}
      </div>
    )
  }

  if (!curriculum || moduleStates.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <EmptyState
          icon={<FeatureIcon name={track === 'BE' ? 'trackBe' : 'trackFe'} size={56} achieved={false} />}
          headline="Curriculum coming soon"
          body="This track's modules haven't been published yet — check back shortly."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <FeatureIcon name={track === 'BE' ? 'trackBe' : 'trackFe'} size={56} className="mx-auto" />
        <h1 className="font-display mt-4 text-3xl font-bold text-ink">{curriculum.name}</h1>
        <p className="mt-2 text-dim">{curriculum.description}</p>
      </header>

      <div ref={containerRef} className="relative">
        {/* Connector lines — SVG overlay behind the cards */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {connectors.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill="none"
              className={c.completed ? 'node-line node-line--completed' : 'node-line'}
            />
          ))}
        </svg>

        <div className="relative flex flex-col gap-4">
          {moduleStates.map((modData) => {
            const isExpanded = expandedIds.has(modData.module.id)
            const lessonStates = computeLessonStates(modData.module, modData.state, statuses ?? [])

            return (
              <motion.div
                key={modData.module.id}
                variants={cascadeItem}
                initial="initial"
                animate="animate"
                ref={(el) => {
                  if (el) nodeRefs.current.set(modData.module.id, el)
                  else nodeRefs.current.delete(modData.module.id)
                }}
              >
                <ModuleNode data={modData} isExpanded={isExpanded} onToggle={() => toggleModule(modData.module.id)} />

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-2 flex flex-col gap-0.5 border-l border-rim-subtle pl-4">
                        {lessonStates.map((lessonData) => (
                          <LessonRow key={lessonData.lesson.id} data={lessonData} trackSlug={track} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
