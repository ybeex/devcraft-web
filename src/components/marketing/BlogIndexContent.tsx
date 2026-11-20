'use client'

import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { IconChip } from '@/components/ui/IconChip'
import { getFeaturedPost, getOtherPosts, type BlogPost } from '@/lib/blog-data'
import { cn } from '@/lib/utils'
import {
  Eyebrow,
  GradientText,
  Reveal,
  RevealGroup,
  RevealItem,
  SpotlightCard,
} from '@/components/marketing/primitives'

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
      <section className="aurora aurora-animate grain relative overflow-hidden px-6 pb-14 pt-24 text-center">
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-[2] mx-auto flex max-w-2xl flex-col items-center">
          <Reveal>
            <Eyebrow>Engineering notes</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
              The DevCraft <GradientText>blog</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-balance text-dim">
              Engineering notes, product decisions, and curriculum thinking from the team building this.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Featured post (2-col hero) ──────────────────────────────────── */}
      <section className="px-6 pb-16">
        <Reveal className="mx-auto max-w-5xl">
          <Link href={`/blog/${featured.slug}`} className="block">
            <div className="spotlight lift group relative grid overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card shadow-elev-md transition-colors duration-300 hover:border-brand/40 sm:grid-cols-2">
              <div className="relative z-[1] flex flex-col justify-center gap-4 p-8 sm:p-10">
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
              <div className="aurora aurora-animate relative flex items-center justify-center border-t border-rim-subtle p-10 sm:border-l sm:border-t-0">
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(closest-side,var(--glow),transparent_72%)] opacity-60"
                />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rim-subtle bg-canvas/70 shadow-elev-md backdrop-blur transition-transform duration-300 group-hover:scale-105">
                  <ArrowRight size={28} className="text-brand transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ─── Post grid ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-20">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <RevealGroup className="relative z-[2] mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {posts.map((post) => (
            <RevealItem key={post.slug} className="h-full">
              <Link href={`/blog/${post.slug}`} className="block h-full">
                <SpotlightCard className="h-full p-6">
                  <div className="flex flex-1 flex-col gap-3">
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
                  </div>
                </SpotlightCard>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  )
}
