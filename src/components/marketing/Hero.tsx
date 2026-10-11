'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { easeOut } from '@/lib/motion/variants'

const HEADLINE = "The last place you learn to code."

const SNIPPETS = [
  {
    lang: 'tsx',
    code: `function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(value),
      delay
    )
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}`,
  },
  {
    lang: 'ts',
    code: `app.post('/api/v1/auth/login', {
  config: { rateLimit: AuthRateLimit },
  schema: { body: LoginBodySchema },
  handler: async (req, reply) => {
    const data = await loginUser(req.body)
    return reply.send({ success: true, data })
  },
})`,
  },
]

export function Hero() {
  const [snippetIndex, setSnippetIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSnippetIndex((i) => (i + 1) % SNIPPETS.length), 6000)
    return () => clearInterval(id)
  }, [])

  const words = HEADLINE.split(' ')

  return (
    <section className="mesh-bg mesh-animate relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-rim-subtle bg-card px-4 py-1.5 text-xs font-semibold text-dim"
        >
          <DevCraftMark size={16} />
          Frontend &amp; Backend Engineering, taught with craft
        </motion.div>

        {/* Headline — word-by-word reveal */}
        <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: easeOut }}
              className="mr-[0.25em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 max-w-xl text-balance text-lg text-dim"
        >
          AI-native, project-driven, beautifully built. Two tracks, done with the depth
          no generalist platform can match.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link href="/register">
            <Button size="lg">
              Start learning — it's free <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="#tracks">
            <Button size="lg" variant="ghost">
              Explore curriculum
            </Button>
          </Link>
        </motion.div>

        {/* Code preview window */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9, ease: easeOut }}
          className="mt-16 w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-[#221e17] text-left shadow-elev-lg"
        >
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#2e271d] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="ml-3 font-mono text-xs text-[#caa894]">
              {SNIPPETS[snippetIndex]!.lang === 'tsx' ? 'useDebounce.ts' : 'auth.routes.ts'}
            </span>
          </div>
          <motion.pre
            key={snippetIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[#fdfbf7]"
          >
            <code>{SNIPPETS[snippetIndex]!.code}</code>
          </motion.pre>
        </motion.div>
      </div>
    </section>
  )
}
