'use client'

import { motion } from 'framer-motion'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { cascadeContainer, cascadeItem, hoverLift, easeOut } from '@/lib/motion/variants'
import { useCountUp } from '@/lib/hooks/useCountUp'

const PRINCIPLES = [
  {
    title: 'Nothing floats without a reason',
    body: 'Every elevated surface has a light source and a shadow that matches it. Flat means background. Raised means interactive. There is no in-between.',
  },
  {
    title: 'Containers earn their border',
    body: 'A label never sits naked next to an icon. The same care we put into the product, we put into how we explain it.',
  },
  {
    title: 'Status is a color, not just a word',
    body: '"Completed," "In review," "Blocked" are never plain text — the color does the talking before the word does.',
  },
  {
    title: 'Motion explains hierarchy',
    body: "If an animation doesn't communicate state, we cut it. A page that slides shows you which direction you moved.",
  },
]

const STATS = [
  { value: 12400, label: 'Learners', suffix: '+' },
  { value: 200, label: 'Lessons shipped', suffix: '+' },
  { value: 48, label: 'Real-world projects', suffix: '' },
  { value: 49, label: 'Average rating', suffix: '/50', isDecimal: true },
]

export function AboutContent() {
  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="mesh-bg mesh-animate px-6 pb-16 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <DevCraftMark size={56} className="mx-auto" />
          <h1 className="mt-6 font-display text-4xl font-bold text-ink sm:text-5xl">
            We hold ourselves to the standard we teach.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-dim">
            Every other platform makes one bet — breadth, or price. We bet on craft: an engineering
            education product built with the same rigor we ask our learners to bring to their own code.
          </p>
        </motion.div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="border-y border-rim-subtle bg-card px-6 py-12">
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mx-auto grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={cascadeItem} className="text-center">
              <StatNumber value={s.value} suffix={s.suffix} isDecimal={s.isDecimal} />
              <p className="mt-1 text-xs text-dim">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Mission ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-ink">Our mission</h2>
          <p className="mt-4 text-base leading-relaxed text-dim">
            Most developer education treats the learning platform as disposable infrastructure —
            a thin wrapper around video or text, with no opinion about whether the product itself
            is well-built. We think that&apos;s backwards. If we&apos;re teaching frontend engineering,
            our frontend should be the best frontend a learner sees that week. If we&apos;re teaching
            backend architecture, our API should hold up to the same scrutiny we ask learners to apply
            to their own.
          </p>
          <p className="mt-4 text-base leading-relaxed text-dim">
            That&apos;s the whole company, really: make engineers who ship, by being a product
            that ships at that standard ourselves.
          </p>
        </div>
      </section>

      {/* ─── Crafted Depth callout ───────────────────────────────────────── */}
      <section className="bg-card px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-2xl rounded-[var(--radius-xl)] border border-rim-subtle bg-canvas p-10 text-center shadow-elev-md"
        >
          <p className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
            &ldquo;Every surface has weight. Every interaction has intention.
            <br className="hidden sm:block" /> Nothing is flat by accident.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-brand">
            — Crafted Depth, our design philosophy
          </p>
        </motion.div>
      </section>

      {/* ─── Principles grid ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">How we build</h2>
          <motion.div
            variants={cascadeContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-10 grid gap-5 sm:grid-cols-2"
          >
            {PRINCIPLES.map((p) => (
              <motion.div
                key={p.title}
                variants={cascadeItem}
                {...hoverLift}
                className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 shadow-elev-sm"
              >
                <h3 className="font-ui text-base font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-dim">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Team ────────────────────────────────────────────────────────── */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink">Built by people who ship</h2>
          <p className="mx-auto mt-3 max-w-md text-dim">
            A small team of engineers and educators who got tired of choosing between
            platforms that taught well and platforms that felt good to use.
          </p>
          <motion.div
            variants={cascadeContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {['Engineering', 'Product Design', 'Curriculum', 'AI Research'].map((role) => (
              <motion.div
                key={role}
                variants={cascadeItem}
                className="flex items-center gap-2 rounded-full border border-rim-subtle bg-canvas px-5 py-2.5"
              >
                <FeatureIcon name="codeWindow" size={20} />
                <span className="text-sm font-medium text-ink">{role}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}

function StatNumber({ value, suffix, isDecimal }: { value: number; suffix: string; isDecimal?: boolean }) {
  const animated = useCountUp(value, 1200)
  const display = isDecimal ? (animated / 10).toFixed(1) : animated.toLocaleString()
  return (
    <p className="font-display text-3xl font-bold text-ink sm:text-4xl">
      {display}
      <span className="text-brand">{suffix}</span>
    </p>
  )
}
