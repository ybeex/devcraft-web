'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { getSnippetByShareToken, parseWebContent, buildWebPreviewDocument } from '@/lib/api/playground'
import { ApiRequestError } from '@/lib/api/client'

export function SharedSnippetView({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const {
    data: snippet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shared-snippet', token],
    queryFn: () => getSnippetByShareToken(token),
    retry: (count, err) => !(err instanceof ApiRequestError && err.statusCode === 404) && count < 2,
  })

  const isWeb = snippet?.language === 'web'
  const webContent = isWeb && snippet ? parseWebContent(snippet.code) : null

  async function handleCopy() {
    if (!snippet) return
    // For web-mode, copy the combined self-contained document — the raw
    // JSON storage format isn't what anyone visiting this page wants.
    const toCopy = webContent ? buildWebPreviewDocument(webContent) : snippet.code
    await navigator.clipboard.writeText(toCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-9 w-1/2" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) notFound()
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="text-sm text-dim">Couldn&rsquo;t load this snippet. Try refreshing the page.</p>
      </div>
    )
  }

  if (!snippet) return null

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href="/playground" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> Playground
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{snippet.title}</h1>
          <p className="mt-1 text-sm text-dim">
            Shared by {snippet.user?.displayName ?? 'Unknown'} ·{' '}
            <span className="font-mono uppercase">{isWeb ? 'HTML/CSS/JS' : snippet.language}</span>
          </p>
          {snippet.description && <p className="mt-2 text-sm text-dim">{snippet.description}</p>}
        </div>
        <button
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim bg-card px-3.5 py-2 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : isWeb ? 'Copy HTML' : 'Copy code'}
        </button>
      </div>

      {webContent ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle">
            <div className="border-b border-rim-subtle bg-raised px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-ghost">
              Live preview
            </div>
            <iframe
              srcDoc={buildWebPreviewDocument(webContent)}
              sandbox="allow-scripts"
              title="Live preview"
              className="h-80 w-full bg-white"
            />
          </div>

          {(['html', 'css', 'js'] as const).map(
            (key) =>
              webContent[key] && (
                <div key={key} className="overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
                  <div className="border-b border-rim-subtle bg-raised px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ghost">
                    {key}
                  </div>
                  <pre className="overflow-x-auto bg-card p-4">
                    <code className="font-mono text-[13px] leading-relaxed text-ink">{webContent[key]}</code>
                  </pre>
                </div>
              )
          )}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle">
          <div className="flex items-center gap-1.5 border-b border-rim-subtle bg-raised px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-error/60" />
            <span className="h-2 w-2 rounded-full bg-warning/60" />
            <span className="h-2 w-2 rounded-full bg-success/60" />
          </div>
          <pre className="overflow-x-auto bg-card p-5">
            <code className="font-mono text-[13px] leading-relaxed text-ink">{snippet.code}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
