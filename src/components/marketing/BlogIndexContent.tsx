'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { IconChip } from '@/components/ui/IconChip'
import { cascadeContainer, cascadeItem, hoverLift, easeOut } from '@/lib/motion/variants'
import { getFeaturedPost, getOtherPosts, type BlogPost } from '@/lib/blog-data'
import { cn } from '@/lib/utils'

const CATEGORY_TONE: Record<BlogPost['category'], 'brand' | 'info' | 'success'> = {
  Engineering: 'brand',
  Product: 'info',
  Community: 'success',
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('')
}

export function BlogIndexContent() {
  const featured = getFeaturedPost()
  const posts = getOtherPosts()

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <section className="mesh-bg px-6 pb-12 pt-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="font-display text-4xl font-bold text-ink sm:text-5xl"
        >
          The DevCraft blog
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="mx-auto mt-3 max-w-md text-dim"
        >
          Engineering notes, product decisions, and curriculum thinking from the team building this.
        </motion.p>
      </section>

      {/* ─── Featured post (2-col hero) ──────────────────────────────────── */}
      <section className="px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          className="mx-auto max-w-5xl"
        >
          <Link href={`/blog/${featured.slug}`}>
            <div
              {...hoverLift}
              className="group grid gap-0 overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card shadow-elev-md sm:grid-cols-2"
            >
              <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                <IconChip
                  icon={<span className="block h-2.5 w-2.5 rounded-full bg-current" />}
                  label={featured.category}
                  variant="tonal"
                  tone={CATEGORY_TONE[featured.category]}
                  className="w-fit"
                />
                <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="text-sm text-dim">{featured.excerpt}</p>
                <div className="flex items-center gap-3 pt-2 text-xs text-dim">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-muted text-[10px] font-bold text-brand">
                    {initials(featured.author.name)}
                  </span>
                  <span>{featured.author.name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {featured.readingTime}
                  </span>
                </div>
              </div>
              <div className="mesh-bg flex items-center justify-center p-10">
                <ArrowRight
                  size={32}
                  className="text-brand transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* ─── Post grid ───────────────────────────────────────────────────── */}
      <section className="bg-card px-6 py-16">
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {posts.map((post) => (
            <motion.div key={post.slug} variants={cascadeItem} {...hoverLift}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-canvas p-6 shadow-elev-sm"
              >
                <IconChip
                  icon={<span className="block h-2.5 w-2.5 rounded-full bg-current" />}
                  label={post.category}
                  variant="tonal"
                  tone={CATEGORY_TONE[post.category]}
                  className="w-fit"
                />
                <h3 className="font-ui text-base font-semibold leading-snug text-ink">{post.title}</h3>
                <p className="line-clamp-2 flex-1 text-sm text-dim">{post.excerpt}</p>
                <div className="flex items-center gap-3 pt-2 text-xs text-dim">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold',
                      'bg-brand-muted text-brand'
                    )}
                  >
                    {initials(post.author.name)}
                  </span>
                  <span>{post.author.name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {post.readingTime}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  )
}
