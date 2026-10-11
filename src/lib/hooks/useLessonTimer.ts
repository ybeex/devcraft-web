import { useEffect, useRef, useState } from 'react'

/** Tracks milliseconds elapsed since mount, pausing when the tab isn't visible. */
export function useLessonTimer(): { getElapsedMs: () => number } {
  const startRef = useRef(Date.now())
  const accumulatedRef = useRef(0)
  const [, forceTick] = useState(0)

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        accumulatedRef.current += Date.now() - startRef.current
      } else {
        startRef.current = Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => forceTick((t) => t + 1), 30_000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [])

  function getElapsedMs(): number {
    const current = document.hidden ? 0 : Date.now() - startRef.current
    return accumulatedRef.current + current
  }

  return { getElapsedMs }
}
