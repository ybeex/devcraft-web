'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import { IconChip } from '@/components/ui/IconChip'
import { easeOut } from '@/lib/motion/variants'
import type { BlogPost, BlogBlock } from '@/lib/blog-data'

const CATEGORY_TONE: Record<BlogPost['category'], 'brand' | 'info' | 'success'> = {
  Engineering: 'brand',
  Product: 'info',
  Community: 'success',
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('')
}

export function BlogArticleContent({ post }: { post: BlogPost }) {
  return (
    <article className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="mx-auto max-w-[680px]"
      >
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-dim transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} /> Back to blog
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <IconChip
            icon={<span className="block h-2.5 w-2.5 rounded-full bg-current" />}
            label={post.category}
            variant="tonal"
            tone={CATEGORY_TONE[post.category]}
          />
          <span className="text-xs text-dim">{post.publishedAt}</span>
        </div>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-6 flex items-center gap-3 border-b border-rim-subtle pb-6 text-sm text-dim">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
            {initials(post.author.name)}
          </span>
          <div>
            <p className="font-semibold text-ink">{post.author.name}</p>
            <p className="text-xs text-dim">{post.author.role}</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs">
            <Clock size={12} /> {post.readingTime}
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          {post.content.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>

        <div className="mt-12 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 text-center">
          <p className="font-ui text-sm font-semibold text-ink">Enjoyed this?</p>
          <p className="mt-1 text-sm text-dim">More engineering notes land every couple of weeks.</p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Read more posts →
          </Link>
        </div>
      </motion.div>
    </article>
  )
}

function BlockRenderer({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-4 font-display text-xl font-bold text-ink">{block.text}</h2>
    case 'p':
      return <p className="text-[1.0625rem] leading-[1.75] text-ink/90">{block.text}</p>
    case 'quote':
      return (
        <blockquote className="border-l-2 border-brand pl-5 font-display text-lg italic leading-snug text-ink">
          {block.text}
        </blockquote>
      )
    case 'code':
      return (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle shadow-elev-sm">
          {/* Code-block chrome — reuses the icon-code-window 3-dot pattern */}
          <div className="flex items-center gap-1.5 bg-[#221e17] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="ml-2 font-mono text-[11px] text-[#caa894]">{block.language}</span>
          </div>
          <pre className="overflow-x-auto bg-[#110f0c] p-4 font-mono text-[13px] leading-relaxed text-[#fdfbf7]">
            <code>{block.code}</code>
          </pre>
        </div>
      )
  }
}
