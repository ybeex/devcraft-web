'use client'

import { motion } from 'framer-motion'
import { Lock, ChevronDown, Clock } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import type { ModuleNodeData } from '@/lib/utils/curriculum-tree'
import { cn } from '@/lib/utils'

interface ModuleNodeProps {
  data: ModuleNodeData
  isExpanded: boolean
  onToggle: () => void
}

export function ModuleNode({ data, isExpanded, onToggle }: ModuleNodeProps) {
  const { module, state, completedCount, totalCount } = data
  const isLocked = state === 'locked'
  const isCompleted = state === 'completed'

  return (
    <button
      onClick={!isLocked ? onToggle : undefined}
      disabled={isLocked}
      title={isLocked ? 'Complete the previous module to unlock' : undefined}
      className={cn(
        'flex w-full items-center gap-4 rounded-[var(--radius-xl)] border p-5 text-left transition-all',
        isLocked && 'cursor-not-allowed border-rim-subtle bg-card opacity-50 grayscale',
        !isLocked && !isCompleted && 'border-rim bg-card shadow-elev-sm hover:shadow-elev-md',
        isCompleted && 'border-brand/30 bg-brand-muted shadow-elev-sm hover:shadow-elev-md'
      )}
    >
      <div className="relative shrink-0">
        {isLocked ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-raised text-ghost">
            <Lock size={20} />
          </div>
        ) : (
          <FeatureIcon name={isCompleted ? 'xpGem' : 'codeWindow'} size={48} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-ui text-base font-bold text-ink">{module.title}</h3>
          {module.isPremium && (
            <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              Pro
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-dim">
          <span>{completedCount} / {totalCount} lessons</span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {module.estimatedHours}h
          </span>
        </div>

        {!isLocked && totalCount > 0 && (
          <div className="mt-2.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {!isLocked && (
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-dim">
          <ChevronDown size={18} />
        </motion.div>
      )}
    </button>
  )
}
