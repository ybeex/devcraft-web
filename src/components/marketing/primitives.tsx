'use client'

import { motion, useInView, useScroll, useSpring, type Variants } from 'framer-motion'
import { useCallback, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

/* ════════════════════════════════════════════════════════════════════════════
   Marketing primitives — the shared motion + depth vocabulary for every
   public-facing page. Built on the "Crafted Depth" tokens in globals.css so the
   whole marketing surface shares one premium language.
════════════════════════════════════════════════════════════════════════════ */

// ─── Reveal — scroll-triggered entrance ──────────────────────────────────────

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: easeOut, delay },
  }),
}

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger offset in seconds. */
  delay?: number
  /** Override the rise distance (default 24px). */
  y?: number
  once?: boolean
}

export function Reveal({ children, className, delay = 0, y, once = true }: RevealProps) {
  const variants: Variants =
    y === undefined
      ? revealVariants
      : {
          hidden: { opacity: 0, y },
          visible: (d: number = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.65, ease: easeOut, delay: d },
          }),
        }

  return (
    <motion.div
      className={className}
      custom={delay}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

// ─── RevealGroup / RevealItem — staggered lists & grids ──────────────────────

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0.05,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={revealItemVariants}>
      {children}
    </motion.div>
  )
}

// ─── GradientText — brand gradient headline accent ───────────────────────────

export function GradientText({
  children,
  className,
  pan = true,
}: {
  children: ReactNode
  className?: string
  pan?: boolean
}) {
  return <span className={cn('text-gradient', pan && 'text-gradient-pan', className)}>{children}</span>
}

// ─── Eyebrow — pill label with a live indicator ──────────────────────────────

export function Eyebrow({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-rim-subtle bg-card/70 px-4 py-1.5 text-xs font-semibold text-dim shadow-elev-sm backdrop-blur',
        className
      )}
    >
      {icon ?? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand pulse-ring" aria-hidden />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
      )}
      {children}
    </span>
  )
}

// ─── SectionHeading — eyebrow + title + subtitle, consistently revealed ──────

interface SectionHeadingProps {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  align?: 'center' | 'left'
  className?: string
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-4', align === 'center' ? 'items-center text-center' : 'items-start', className)}>
      {eyebrow && (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="text-balance font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.12}>
          <p className={cn('max-w-xl text-balance text-base text-dim sm:text-lg', align === 'center' && 'mx-auto')}>
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  )
}

// ─── SpotlightCard — cursor-tracking glow + gradient hairline ring ───────────

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  /** Show the gradient hairline ring on hover. */
  ring?: boolean
  /** Always-on brand glow (for the featured/hero card). */
  glow?: boolean
  /** Lift on hover (default true). */
  interactive?: boolean
  /**
   * Override the spotlight/ring/glow hue. `fe` stays on the brand orange;
   * `be` recolours the whole hover treatment blue so a Backend card never
   * glows orange.
   */
  accent?: 'brand' | 'fe' | 'be'
}

// Inline overrides for the shared aurora/glow custom properties. Scoped to the
// card so its ::before spotlight and ring inherit the track's discipline colour.
const ACCENT_VARS: Record<'brand' | 'fe' | 'be', CSSProperties> = {
  brand: {},
  fe: {
    '--aurora-a': '255, 121, 0',
    '--aurora-b': '255, 170, 0',
    '--aurora-c': '57, 133, 255',
    '--glow': 'rgba(255, 121, 0, 0.14)',
  } as CSSProperties,
  be: {
    '--aurora-a': '57, 133, 255',
    '--aurora-b': '108, 150, 255',
    '--aurora-c': '150, 186, 255',
    '--glow': 'rgba(57, 133, 255, 0.18)',
  } as CSSProperties,
}

export function SpotlightCard({
  children,
  className,
  ring = true,
  glow = false,
  interactive = true,
  accent = 'brand',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      style={ACCENT_VARS[accent]}
      className={cn(
        'spotlight group relative rounded-[var(--radius-xl)] border border-rim-subtle bg-card shadow-elev-sm transition-shadow duration-300 hover:shadow-elev-lg',
        interactive && 'lift',
        glow && 'glow-brand',
        className
      )}
    >
      {ring && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={
            {
              padding: 1,
              background:
                'linear-gradient(135deg, rgba(var(--aurora-a),.75), rgba(var(--aurora-c),.45) 45%, rgba(var(--aurora-b),.15) 80%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              maskComposite: 'exclude',
            } as CSSProperties
          }
        />
      )}
      <div className="relative z-[1] flex h-full flex-col">{children}</div>
    </div>
  )
}

// ─── Marquee — seamless infinite scroll with edge fade + hover pause ─────────

interface MarqueeProps {
  children: ReactNode
  className?: string
  /** Seconds for one full loop. */
  duration?: number
  reverse?: boolean
  gap?: string
  pauseOnHover?: boolean
}

export function Marquee({
  children,
  className,
  duration = 42,
  reverse = false,
  gap = '1.25rem',
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={cn('relative overflow-hidden mask-fade-x', pauseOnHover && 'marquee-pause', className)}
      style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
    >
      <div className={cn('flex w-max', reverse ? 'animate-marquee-reverse' : 'animate-marquee')} style={{ gap }}>
        <div className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0" style={{ gap }} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── ScrollProgress — top-of-page reading progress ───────────────────────────

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-[var(--brand)] via-[var(--brand-2)] to-[var(--track-be)]"
    />
  )
}

// ─── AnimatedStat — count-up number with gradient treatment ──────────────────

interface AnimatedStatProps {
  value: number
  label: string
  suffix?: string
  prefix?: string
  decimals?: number
  /** Divide the animated value before display (e.g. 10 for one-decimal ratings). */
  divisor?: number
  className?: string
}

export function AnimatedStat({
  value,
  label,
  suffix = '',
  prefix = '',
  decimals,
  divisor = 1,
  className,
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const animated = useCountUp(inView ? value : 0, 1400)
  const display = divisor > 1 ? (animated / divisor).toFixed(decimals ?? 0) : animated.toLocaleString()

  return (
    <div ref={ref} className={cn('text-center', className)}>
      <div className="font-display text-4xl font-bold tabular-nums text-ink sm:text-5xl">
        {prefix}
        <GradientText pan={false}>{display}</GradientText>
        {suffix}
      </div>
      <div className="mt-2 text-sm text-dim">{label}</div>
    </div>
  )
}
