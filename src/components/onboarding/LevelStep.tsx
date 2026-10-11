'use client'

import { PlacementFlow } from '@/components/placement/PlacementFlow'
import type { PlacementResult } from '@/lib/api/placement'

interface LevelStepProps {
  track: 'FE' | 'BE'
  onDone: (result: PlacementResult) => void
  onLater: () => void
}

/** Optional: "Decide later" skips it, and the first lessons then simply start at the beginning. */
export function LevelStep({ track, onDone, onLater }: LevelStepProps) {
  return <PlacementFlow track={track} tone="onboarding" onDone={onDone} onLater={onLater} />
}
