'use client'

import { PlacementFlow } from '@/components/placement/PlacementFlow'
import { Eyebrow } from '@/components/marketing/primitives'
import type { PlacementResult } from '@/lib/api/placement'

interface LevelStepProps {
  track: 'FE' | 'BE'
  onDone: (result: PlacementResult) => void
  onLater: () => void
}

/** Optional: "Decide later" skips it, and the first lessons then simply start at the beginning. */
export function LevelStep({ track, onDone, onLater }: LevelStepProps) {
  return (
    <div className="flex flex-col items-center">
      <Eyebrow>Step 3 · Find your level</Eyebrow>
      <div className="mt-6 w-full">
        <PlacementFlow track={track} onDone={onDone} onLater={onLater} />
      </div>
    </div>
  )
}
