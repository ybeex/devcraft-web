'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, ExternalLink, Globe, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiRequestError } from '@/lib/api/client'
import { createPreview, deletePreview, listPreviews } from '@/lib/api/previews'

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
const STARTER = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>My shop</title></head>
<body>
  <h1>My shop</h1>
  <ul id="list"></ul>
  <script>
    // API_BASE and API_KEY are filled in for you on a published page.
    fetch(API_BASE + '/products?limit=5', { headers: { 'X-Storefront-Key': API_KEY } })
      .then((r) => r.json())
      .then(({ data }) => { list.innerHTML = data.map((p) => '<li>' + p.name + '</li>').join('') })
  </script>
</body>
</html>`

export function PreviewsWorkspace() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['previews'], queryFn: listPreviews })
  const [title, setTitle] = useState('My page')
  const [html, setHtml] = useState(STARTER)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['previews'] })
  const fail = (e: unknown) => setError(e instanceof ApiRequestError ? e.message : 'Something went wrong. Try again.')
  const add = useMutation({ mutationFn: () => createPreview(title, html), onSuccess: () => { setError(null); void refresh() }, onError: fail })
  const del = useMutation({ mutationFn: deletePreview, onSuccess: () => { setError(null); void refresh() }, onError: fail })
  const d = q.data

  if (q.isLoading) return <p className="mt-8 text-sm text-ghost">Loading…</p>
  if (!d) return <p className="mt-8 text-sm text-error">Could not load your previews. Try again.</p>
  if (!d.pro) {
    return (
      <div className="mt-8 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 text-center">
        <Lock className="mx-auto text-ghost" size={22} />
        <p className="mt-2 font-semibold text-ink">Hosted previews are part of Pro</p>
        <p className="mt-1 text-sm text-dim">Publish the pages you build in the browser lessons and share a link with anyone.</p>
        <Link href="/pro" className="mt-4 inline-block"><Button>See Pro</Button></Link>
      </div>
    )
  }
  return (
    <div className="mt-6 flex flex-col gap-6">
      {!d.available && <p className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-4 text-sm text-dim">Hosted previews are not switched on for this server yet.</p>}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Your previews <span className="font-normal text-ghost">({d.items.length} of {d.limit})</span></h2>
        {d.items.length === 0 && <p className="mt-3 text-sm text-ghost">Nothing published yet. Use <strong>Publish preview</strong> in a browser lesson, or paste a page below.</p>}
        <ul className="mt-2 divide-y divide-rim-subtle">
          {d.items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3" data-testid="preview-row">
              <Globe size={15} className="text-ghost" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                <p className="truncate font-mono text-[11px] text-ghost">{p.url}</p>
                <p className="text-[11px] text-ghost">Updated {when(p.updatedAt)} · {p.viewCount} view{p.viewCount === 1 ? '' : 's'} · {(p.sizeBytes / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { void navigator.clipboard?.writeText(p.url); setCopied(p.id); setTimeout(() => setCopied(null), 1500) }} className="flex items-center gap-1 text-xs text-brand">{copied === p.id ? <Check size={12} /> : <Copy size={12} />} Copy link</button>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand"><ExternalLink size={12} /> Open</a>
              <button onClick={() => { if (window.confirm(`Take "${p.title}" down? The link stops working.`)) del.mutate(p.id) }} className="flex items-center gap-1 text-xs text-error"><Trash2 size={12} /> Delete</button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Publish a page</h2>
        <p className="mt-1 text-xs text-dim">One HTML file with its CSS and JavaScript inside, up to {d.maxKb} KB. It can call the Storefront API (<code className="font-mono">API_BASE</code> and <code className="font-mono">API_KEY</code> are provided), nothing else on the internet, and it gets a banner saying it is a practice project.</p>
        <label className="mt-3 block text-[11px] text-ghost">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="mt-1 w-full rounded border border-rim-subtle bg-canvas px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="mt-3 block text-[11px] text-ghost">HTML
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={12} spellCheck={false} className="mt-1 w-full rounded border border-rim-subtle bg-canvas p-2 font-mono text-xs text-ink" />
        </label>
        <Button className="mt-3" size="sm" onClick={() => add.mutate()} disabled={add.isPending || !d.available || !title.trim() || !html.trim()}>{add.isPending ? 'Publishing…' : 'Publish'}</Button>
      </section>
    </div>
  )
}
