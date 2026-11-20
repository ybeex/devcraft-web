'use client'

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'
import { Eyebrow, GradientText } from './primitives'

const HEADLINE_LEAD = ['The', 'last', 'place', 'you']
const HEADLINE_ACCENT = ['learn', 'to', 'code.']

const TRUST = ['Free forever', 'No credit card', '200+ lessons']

const SNIPPETS = [
  {
    file: 'useDebounce.ts',
    code: `export function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(value),
      delay,
    )
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}`,
  },
  {
    file: 'auth.routes.ts',
    code: `app.post('/api/v1/auth/login', {
  config: { rateLimit: AuthRateLimit },
  schema: { body: LoginBodySchema },
  handler: async (req, reply) => {
    const user = await findUserByEmail(req.body.email)
    if (!user) {
      return reply.code(401).send('Invalid credentials')
    }

    const data = await loginUser(user)
    return reply.send({ success: true, data })
  },
})`,
  },
]

const SPRING = { stiffness: 120, damping: 20, mass: 0.4 }

// ─── Syntax highlighting ─────────────────────────────────────────────────────
// Colours come from the shared `syntax-*` classes (globals.css), which resolve to
// the --code-* tokens — so the panel follows the app's light/dark theming.

const SYNTAX = {
  keyword: 'syntax-keyword',
  fn: 'syntax-function',
  string: 'syntax-string',
  number: 'syntax-number',
  attr: 'syntax-attribute',
  punct: 'text-dim',
  comment: 'syntax-comment',
} as const

const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'export',
  'import',
  'from',
  'async',
  'await',
  'new',
  'if',
  'else',
  'for',
  'of',
  'in',
  'type',
  'interface',
  'class',
  'extends',
  'implements',
  'as',
  'void',
  'typeof',
  'this',
  'true',
  'false',
  'null',
  'undefined',
])

const TOKEN_RE = /(\/\/.*$)|(`[^`]*`|'[^']*'|"[^"]*")|([A-Za-z_$][\w$]*)|(\d+(?:\.\d+)?)|([{}()[\];,.:=+\-*/<>!&|?]+)/g

function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0

  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const [full, comment, str, ident, num, punct] = m
    let className: string | undefined

    if (comment) className = SYNTAX.comment
    else if (punct) className = SYNTAX.punct
    else if (str) className = SYNTAX.string
    else if (num) className = SYNTAX.number
    else if (ident) {
      const after = line[m.index + ident.length]
      if (KEYWORDS.has(ident)) className = SYNTAX.keyword
      else if (after === '(' || after === '<') className = SYNTAX.fn
      else if (after === ':') className = SYNTAX.attr
    }

    out.push(
      <span key={key++} className={className}>
        {full}
      </span>
    )
    last = m.index + full.length
  }

  if (last < line.length) out.push(line.slice(last))
  return out
}

export function Hero() {
  const [snippetIndex, setSnippetIndex] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setSnippetIndex((i) => (i + 1) % SNIPPETS.length), 7000)
    return () => clearInterval(id)
  }, [])

  // Pointer-driven parallax + hero spotlight, in normalized [-0.5, 0.5] space.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [9, -9]), SPRING)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-7, 7]), SPRING)
  const glowX = useTransform(px, (v) => `${50 + v * 100}%`)
  const glowY = useTransform(py, (v) => `${40 + v * 100}%`)
  const spotlight = useMotionTemplate`radial-gradient(640px circle at ${glowX} ${glowY}, rgba(var(--aurora-a), .12), transparent 70%)`

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    px.set(0)
    py.set(0)
  }

  const active = SNIPPETS[snippetIndex]!
  const lines = active.code.split('\n')

  return (
    <section
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="aurora aurora-animate grain relative overflow-hidden px-6 pb-24 pt-24 sm:pt-28"
    >
      {/* hairline grid, fading out toward the edges */}
      <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
      {/* pointer spotlight */}
      <motion.div aria-hidden style={{ background: spotlight }} className="pointer-events-none absolute inset-0 z-[1]" />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 sm:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-12">
        {/* ─── Left: message ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Eyebrow icon={<DevCraftMark size={16} />}>Frontend &amp; Backend Engineering, taught with craft</Eyebrow>
          </motion.div>

          {/* Headline — word-by-word blur reveal with a gradient accent */}
          <h1 className="mt-7 text-balance font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
            {HEADLINE_LEAD.map((word, i) => (
              <motion.span
                key={`lead-${i}`}
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.55, delay: i * 0.075, ease: easeOut }}
                className="mr-[0.22em] inline-block"
              >
                {word}
              </motion.span>
            ))}
            {HEADLINE_ACCENT.map((word, i) => (
              <motion.span
                key={`accent-${i}`}
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.55, delay: (HEADLINE_LEAD.length + i) * 0.075, ease: easeOut }}
                className="mr-[0.22em] inline-block"
              >
                <GradientText>{word}</GradientText>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6 }}
            className="mt-6 max-w-lg text-balance text-lg text-dim"
          >
            AI-native, project-driven, beautifully built. Two tracks, done with the depth no generalist
            platform can match.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Link href="/register">
              <Button size="lg" className="shine glow-brand">
                Start learning — it&apos;s free <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="#tracks">
              <Button size="lg" variant="ghost" className="group">
                Explore curriculum
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.85 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-dim lg:justify-start"
          >
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check size={14} className="text-brand" />
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.5 }}
            className="mt-6 flex items-center gap-2 text-xs text-ghost"
          >
            <Star size={13} className="text-brand" />
            Rated 4.9/5 by 12,400+ learners
          </motion.div>
        </div>

        {/* ─── Right: code preview — 3D tilt stage with floating proof chips ── */}
        <div className="w-full [perspective:1400px]">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: easeOut }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative"
          >
            <div aria-hidden className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_10%,var(--glow),transparent_70%)] blur-2xl" />

            <div className="ring-gradient overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-[var(--code-bg)] text-left shadow-elev-lg">
              <div className="flex items-center gap-2 border-b border-rim-subtle bg-raised px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-error" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="ml-3 font-mono text-xs text-dim">{active.file}</span>
                <div className="ml-auto flex items-center gap-1">
                  {SNIPPETS.map((s, i) => (
                    <button
                      key={s.file}
                      onClick={() => setSnippetIndex(i)}
                      aria-label={`Show ${s.file}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === snippetIndex ? 'w-5 bg-brand' : 'w-1.5 bg-rim hover:bg-dim'
                      )}
                    />
                  ))}
                </div>
              </div>

              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-ink">
                <code>
                  {lines.map((line, i) => (
                    <motion.span
                      key={`${snippetIndex}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
                      className="block whitespace-pre"
                    >
                      {line ? highlightLine(line) : '\u00A0'}
                    </motion.span>
                  ))}
                  <motion.span
                    key={`caret-${snippetIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + lines.length * 0.05 }}
                    className="caret mt-1 inline-block h-[15px] w-[7px] bg-brand align-middle"
                  />
                </code>
              </pre>
            </div>

            <ProofChip className="animate-float -left-3 -top-4 sm:-left-6" icon={<FeatureIcon name="projectRocket" size={22} />}>
              <span className="font-semibold text-ink">Lesson complete</span>
              <span className="text-brand">+120 XP</span>
            </ProofChip>
            <ProofChip
              className="animate-float-slow -right-2 top-20 sm:-right-6"
              icon={<FeatureIcon name="streak" size={22} />}
            >
              <span className="font-semibold text-ink">12-day streak</span>
            </ProofChip>
            <ProofChip
              className="animate-float -bottom-5 left-6 sm:left-10"
              icon={<FeatureIcon name="certificate" size={22} />}
            >
              <span className="font-semibold text-ink">Certificate unlocked</span>
            </ProofChip>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ProofChip({
  children,
  icon,
  className,
}: {
  children: ReactNode
  icon: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute z-20 flex items-center gap-2.5 rounded-2xl border border-rim-subtle bg-canvas/90 px-3.5 py-2.5 text-xs shadow-elev-lg backdrop-blur-md',
        className
      )}
    >
      {icon}
      <span className="flex flex-col items-start leading-tight">{children}</span>
    </div>
  )
}
