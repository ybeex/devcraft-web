'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { markSpin, markWobble } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface DevCraftMarkProps {
  size?: number
  animate?: 'none' | 'spin' | 'wobble'
  className?: string
}

/**
 * The DevCraft gem-drop mark. Theme-aware (swaps SVG source on dark/light),
 * and exposes two reserved animation modes:
 *   - 'spin'   → full Y-axis rotation, used by BrandedLoader for full-page loads
 *   - 'wobble' → gentle back-and-forth tilt, used on 404 pages
 * Default 'none' renders a static mark — this is the only mode used in nav bars,
 * headers, and anywhere the mark appears as a logo rather than a loading/error cue.
 */
export function DevCraftMark({ size = 40, animate = 'none', className }: DevCraftMarkProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render the light mark until the theme is known client-side
  useEffect(() => setMounted(true), [])
  const src = mounted && resolvedTheme === 'dark'
    ? '/brand/logo/devcraft-mark-dark.svg'
    : '/brand/logo/devcraft-mark-light.svg'

  const variants = animate === 'spin' ? markSpin : animate === 'wobble' ? markWobble : undefined

  const image = (
    <Image
      src={src}
      alt="DevCraft"
      width={size}
      height={size}
      priority
      className={cn('select-none', className)}
    />
  )

  if (!variants) return image

  return (
    <motion.div
      variants={variants}
      animate="animate"
      style={{ transformStyle: 'preserve-3d', display: 'inline-block' }}
    >
      {image}
    </motion.div>
  )
}
