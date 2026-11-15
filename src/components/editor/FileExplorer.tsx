'use client'

import { ChevronDown, ChevronRight, File as FileIcon, FilePlus, Folder, Lock, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { LabFile } from '@/lib/lab-files'
import { cn } from '@/lib/utils'

interface Node { name: string; path: string; file?: LabFile; children: Node[] }

function buildTree(files: LabFile[]): Node[] {
  const root: Node = { name: '', path: '', children: [] }
  for (const file of files) {
    const parts = file.name.split('/').filter(Boolean)
    let cursor = root
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/')
      let next = cursor.children.find((child) => child.path === path)
      if (!next) { next = { name: part, path, children: [] }; cursor.children.push(next) }
      if (index === parts.length - 1) next.file = file
      cursor = next
    })
  }
  const sort = (nodes: Node[]): Node[] => nodes
    .sort((a, b) => Number(!!a.file) - Number(!!b.file) || a.name.localeCompare(b.name))
    .map((node) => ({ ...node, children: sort(node.children) }))
  return sort(root.children)
}

/** Flat list of what is currently visible, used for arrow-key navigation. */
function visible(nodes: Node[], collapsed: Set<string>, depth = 0, out: Array<{ node: Node; depth: number }> = []) {
  for (const node of nodes) {
    out.push({ node, depth })
    if (!node.file && !collapsed.has(node.path)) visible(node.children, collapsed, depth + 1, out)
  }
  return out
}

interface FileExplorerProps {
  files: LabFile[]
  active: string
  onSelect: (name: string) => void
  /** When provided, learners can add and delete their own files (never the lesson's read-only ones). */
  onCreate?: (name: string) => string | null
  onDelete?: (name: string) => void
}

export function FileExplorer({ files, active, onSelect, onCreate, onDelete }: FileExplorerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tree = useMemo(() => buildTree(files), [files])
  const rows = visible(tree, collapsed)

  const toggle = (path: string) => setCollapsed((prev) => { const next = new Set(prev); if (next.has(path)) next.delete(path); else next.add(path); return next })

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = rows.findIndex((row) => row.node.path === (document.activeElement as HTMLElement | null)?.dataset.path)
    const move = (to: number) => { const row = rows[Math.max(0, Math.min(rows.length - 1, to))]; if (row) { event.preventDefault(); refs.current[row.node.path]?.focus() } }
    if (event.key === 'ArrowDown') move(index + 1)
    else if (event.key === 'ArrowUp') move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(rows.length - 1)
    else if (event.key === 'ArrowRight' && rows[index] && !rows[index]!.node.file && collapsed.has(rows[index]!.node.path)) { event.preventDefault(); toggle(rows[index]!.node.path) }
    else if (event.key === 'ArrowLeft' && rows[index] && !rows[index]!.node.file && !collapsed.has(rows[index]!.node.path)) { event.preventDefault(); toggle(rows[index]!.node.path) }
  }

  function submit() {
    const result = onCreate?.(draft.trim())
    if (result) { setProblem(result); return }
    setCreating(false); setDraft(''); setProblem(null)
  }

  return (
    <nav aria-label="Project files" className="flex w-52 shrink-0 flex-col border-r border-rim-subtle bg-card text-xs">
      <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ghost">
        Files
        {onCreate && <button type="button" aria-label="New file" onClick={() => { setCreating(true); setProblem(null) }} className="rounded p-1 hover:bg-raised hover:text-ink"><FilePlus size={13} /></button>}
      </div>
      <div role="tree" aria-label="Files" onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto pb-2">
        {rows.map(({ node, depth }) => {
          const isFile = !!node.file
          const open = !collapsed.has(node.path)
          return (
            <div key={node.path} role="treeitem" aria-level={depth + 1} aria-selected={isFile ? node.path === active : undefined} aria-expanded={isFile ? undefined : open} className="group flex items-center">
              <button
                ref={(el) => { refs.current[node.path] = el }}
                type="button"
                data-path={node.path}
                data-testid={isFile ? `file-tab-${node.path}` : `folder-${node.path}`}
                onClick={() => (isFile ? onSelect(node.path) : toggle(node.path))}
                style={{ paddingLeft: 8 + depth * 12 }}
                className={cn('flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pr-2 text-left font-mono transition-colors', node.path === active && isFile ? 'bg-raised text-ink' : 'text-dim hover:bg-raised hover:text-ink')}
              >
                {isFile ? <FileIcon size={12} className="shrink-0" /> : open ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
                {!isFile && <Folder size={12} className="shrink-0" />}
                <span className="truncate">{node.name}</span>
                {node.file?.readonly && <Lock size={10} aria-label="read only" className="shrink-0 text-ghost" />}
              </button>
              {isFile && !node.file!.readonly && onDelete && files.length > 1 && (
                <button type="button" aria-label={`Delete ${node.path}`} onClick={() => onDelete(node.path)} className="mr-1 hidden rounded p-1 text-ghost hover:text-error focus:block group-hover:block"><Trash2 size={11} /></button>
              )}
            </div>
          )
        })}
        {creating && (
          <div className="px-2 pt-1">
            <input
              autoFocus
              aria-label="New file path"
              value={draft}
              placeholder="src/Button.jsx"
              onChange={(event) => { setDraft(event.target.value); setProblem(null) }}
              onKeyDown={(event) => { if (event.key === 'Enter') submit(); if (event.key === 'Escape') { setCreating(false); setDraft(''); setProblem(null) } }}
              onBlur={() => { if (!draft) setCreating(false) }}
              className="w-full rounded border border-rim-subtle bg-canvas px-2 py-1 font-mono text-xs text-ink"
            />
            {problem && <p role="alert" className="mt-1 text-[11px] text-error">{problem}</p>}
          </div>
        )}
      </div>
    </nav>
  )
}
