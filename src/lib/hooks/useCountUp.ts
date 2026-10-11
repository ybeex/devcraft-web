'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from its previous value to `target` over `duration`ms.
 * No dependency — built on requestAnimationFrame directly, per Design
 * Philosophy §11 ("Numbers that change, count" — never a hard cut).
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    const start = performance.now()
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutQuad(progress)
      const current = Math.round(from + (target - from) * eased)
      setValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
