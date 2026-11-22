'use client'

import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Play, RotateCcw, Send, TriangleAlert, XCircle } from 'lucide-react'
import type { CheckResult, LessonDetail } from '@/lib/api/lessons'
import { cn } from '@/lib/utils'
import { runLab, type DnsRecord, type DnsResolveScenario, type DnsZoneScenario, type HttpRequestScenario, type HttpResponseScenario, type LabKind, type LabResult } from '@/lib/protocol-lab/engine'
import { SequenceDiagram } from '@/components/visuals/SequenceDiagram'
import { LessonTestsPanel } from './LessonOutputPane'

const COPY: Record<LabKind, { editor: string; send: string; placeholder: string }> = {
  'http-request': { editor: 'Your HTTP request', send: 'Send request', placeholder: 'GET /products HTTP/1.1\nHost: shop.devcraft.dev' },
  'http-response': { editor: 'Your HTTP response', send: 'Deliver response', placeholder: 'HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: 2\n\nhi' },
  'dns-zone': { editor: 'Your zone file', send: 'Look the names up', placeholder: '$ORIGIN example.com.\n@ A 192.0.2.1' },
  'dns-resolve': { editor: 'Your resolver’s questions', send: 'Ask the servers', placeholder: 'ask root example.com A' },
}

/** A numbered plain-text editor. Lines that have a problem are marked, so "line 3" in a message points at something visible. */
function TextEditor({ value, onChange, diags, label }: { value: string; onChange: (v: string) => void; diags: LabResult['diagnostics']; label: string }) {
  const gutter = useRef<HTMLDivElement>(null)
  const lines = Math.max(value.split('\n').length, 8)
  const level = (n: number) => diags.some((d) => d.line === n && d.level === 'error') ? 'error' : diags.some((d) => d.line === n) ? 'warning' : null
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle bg-[var(--code-bg)] font-mono text-[13px] leading-6">
      <div ref={gutter} aria-hidden className="w-10 shrink-0 select-none overflow-hidden border-r border-rim-subtle bg-raised py-3 text-right text-ghost">
        {Array.from({ length: lines }, (_, i) => { const l = level(i + 1); return <div key={i} className={cn('pr-2', l === 'error' && 'bg-[var(--negative-bg)] font-bold text-error', l === 'warning' && 'bg-[var(--brand-muted)] font-bold text-warning')}>{i + 1}</div> })}
      </div>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop }}
        aria-label={label} data-testid="protocol-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off"
        className="min-w-0 flex-1 resize-none bg-transparent p-3 text-ink outline-none"
      />
    </div>
  )
}

const Pre = ({ children, className }: { children: React.ReactNode; className?: string }) => <pre className={cn('overflow-x-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-[var(--code-bg)] p-3 font-mono text-[12.5px] leading-5 text-ink', className)}>{children}</pre>
const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wide text-ghost first:mt-0">{children}</h3>

function Scenario({ lab, scn }: { lab: LabKind; scn: unknown }) {
  if (lab === 'http-request') {
    const s = scn as HttpRequestScenario
    return (
      <div>
        {s.goal && <p className="mb-3 text-[13px] font-medium text-ink">{s.goal}</p>}
        <H>The server{s.server.host ? ` (${s.server.host})` : ''} has these routes</H>
        <ul className="space-y-1 font-mono text-[12px]">
          {s.server.routes.map((r, i) => (
            <li key={i} className="rounded bg-raised px-2 py-1.5"><span className="font-bold text-brand">{r.method}</span> <span className="text-ink">{r.path}</span>
              {(r.requireHeaders || r.requireJson || r.requireFields) && <span className="ml-2 font-ui text-dim">needs {[...Object.keys(r.requireHeaders ?? {}).map((h) => `${h} header`), r.requireJson ? 'a JSON body' : '', ...(r.requireFields?.length ? [`fields ${r.requireFields.join(', ')}`] : [])].filter(Boolean).join(', ')}</span>}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (lab === 'http-response') { const s = scn as HttpResponseScenario; return <div>{s.client && <p className="mb-2 text-[13px] text-dim">{s.client}</p>}<H>The request you must answer</H><Pre>{s.request}</Pre></div> }
  if (lab === 'dns-zone') {
    const s = scn as DnsZoneScenario
    return (
      <div>
        <H>Your domain</H><Pre>{s.origin}</Pre>
        <H>Names that must work</H><ul className="space-y-1 font-mono text-[12px]">{s.queries.map((q, i) => <li key={i} className="rounded bg-raised px-2 py-1.5">{q.name} <span className="font-bold text-brand">{q.type}</span></li>)}</ul>
        {s.world && <><H>Other people’s records you can point to</H><ul className="space-y-1 font-mono text-[12px]">{Object.values(s.world).flat().map((r: DnsRecord, i) => <li key={i} className="rounded bg-raised px-2 py-1.5">{r.name} {r.type} {r.value}</li>)}</ul></>}
      </div>
    )
  }
  const s = scn as DnsResolveScenario
  return (
    <div>
      <H>Your goal</H><Pre>{s.target.name} {s.target.type}</Pre>
      <H>Servers on the internet</H>
      <ul className="space-y-1 font-mono text-[12px]">{Object.entries(s.servers).map(([n, d]) => <li key={n} className="rounded bg-raised px-2 py-1.5"><span className="text-ink">{n}</span> <span className="text-dim">{d.ip}</span>{n === s.start && <span className="ml-2 font-ui font-semibold text-brand">you start here</span>}</li>)}</ul>
      <p className="mt-2 text-[12px] text-dim">You may only ask a server you have been told about.</p>
    </div>
  )
}

function Outcome({ lab, result }: { lab: LabKind; result: LabResult }) {
  const r = result as LabResult & Record<string, any>
  if (lab === 'http-request') return <><H>The server’s reply</H><Pre>{r.response?.raw}</Pre></>
  if (lab === 'http-response') return <><H>What the client understood</H><Pre>{r.response?.status ? `status: ${r.response.status} ${r.response.reason}  (${r.response.class})\ncontent type: ${r.response.headers['content-type'] ?? 'none'}\nbody: ${r.response.bodyBytes} bytes${r.response.json !== null ? `\nparsed JSON: ${JSON.stringify(r.response.json)}` : ''}` : 'Nothing it could read yet.'}</Pre></>
  if (lab === 'dns-zone') return <><H>What each lookup returned</H><div className="space-y-1.5">{(r.queries as Array<{ name: string; type: string; rcode: string; answers: DnsRecord[] }>).map((q, i) => <div key={i} className="rounded bg-raised px-2 py-1.5 font-mono text-[12px]"><span className="text-ink">{q.name} {q.type}</span> → <span className={cn('font-bold', q.rcode === 'NOERROR' && q.answers.some((a) => a.type === q.type) ? 'text-success' : 'text-error')}>{q.answers.some((a) => a.type === q.type) ? q.answers.filter((a) => a.type === q.type).map((a) => a.value).join(', ') : q.rcode}</span></div>)}</div></>
  return <><H>Where you got to</H><Pre>{r.resolved ? `resolved: ${r.resolved}\nquestions asked: ${r.queries}, referrals followed: ${r.referrals}` : `not resolved yet (${r.queries} question${r.queries === 1 ? '' : 's'} asked)`}</Pre></>
}

export function ProtocolLabPane({ lesson, code, onChange, onCheck, onReset, isChecking, checkResult }: { lesson: LessonDetail; code: string; onChange: (v: string) => void; onCheck: () => void; onReset: () => void; isChecking: boolean; checkResult: CheckResult | null }) {
  const lab = lesson.environment?.lab as LabKind | undefined
  const scenario = lesson.environment?.scenario
  const deferred = useDeferredValue(code)
  const result = useMemo(() => (lab ? runLab(lab, scenario, deferred) : null), [lab, scenario, deferred])
  const [sent, setSent] = useState(0)
  const [qi, setQi] = useState(0)
  if (!lab || !result) return <p className="p-4 text-sm text-dim">This lesson has no lab configured.</p>
  const copy = COPY[lab]
  const zoneQueries = lab === 'dns-zone' ? (result.queries as Array<{ name: string; type: string; trace: LabResult['trace'] }>) : null
  const trace = zoneQueries ? zoneQueries[Math.min(qi, zoneQueries.length - 1)]!.trace : result.trace
  const hasSent = sent > 0
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-testid="protocol-lab-pane">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 xl:grid-cols-2 xl:overflow-hidden">
        <section className="flex min-h-[320px] flex-col gap-2 xl:min-h-0 xl:overflow-y-auto" aria-label="Your work">
          <div className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-3"><Scenario lab={lab} scn={scenario} /></div>
          <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wide text-ghost">{copy.editor}</h2>
            <button type="button" onClick={onReset} className="flex items-center gap-1 text-xs text-dim hover:text-ink"><RotateCcw size={12} />Reset</button></div>
          <TextEditor value={code} onChange={onChange} diags={result.diagnostics} label={copy.editor} />
          <ul className="space-y-1" aria-live="polite" data-testid="protocol-diagnostics">
            {result.diagnostics.length === 0 && code.trim() && <li className="flex items-start gap-1.5 text-xs text-success"><CheckCircle2 size={13} className="mt-px shrink-0" />No problems found in the format.</li>}
            {result.diagnostics.map((d, i) => <li key={i} className={cn('flex items-start gap-1.5 text-xs', d.level === 'error' ? 'text-error' : 'text-warning')}>{d.level === 'error' ? <XCircle size={13} className="mt-px shrink-0" /> : <TriangleAlert size={13} className="mt-px shrink-0" />}<span><b>Line {d.line}:</b> {d.message}</span></li>)}
          </ul>
        </section>
        <section className="flex min-h-0 flex-col gap-2 xl:overflow-y-auto" aria-label="What happens">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSent((n) => n + 1)} className="btn-3d flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-[#080D1C]" data-testid="protocol-send"><Send size={13} />{copy.send}</button>
            <button type="button" onClick={onCheck} disabled={isChecking} className="flex items-center gap-1.5 rounded-full border border-rim px-3.5 py-1.5 text-xs font-semibold text-ink hover:text-brand disabled:opacity-50" data-testid="protocol-check"><Play size={13} />{isChecking ? 'Checking…' : 'Check'}</button>
          </div>
          {hasSent && zoneQueries && <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Choose a lookup to watch">{zoneQueries.map((q, i) => <button key={i} type="button" role="tab" aria-selected={i === qi} onClick={() => { setQi(i); setSent((n) => n + 1) }} className={cn('rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold', i === qi ? 'bg-brand text-[#080D1C]' : 'bg-raised text-dim hover:text-ink')}>{q.name} {q.type}</button>)}</div>}
          {hasSent ? <SequenceDiagram steps={trace} title="What travelled" autoPlay replayKey={`${sent}-${qi}`} /> : <div className="rounded-[var(--radius-md)] border border-dashed border-rim p-6 text-center text-sm text-dim">Write your message, then press <b>{copy.send}</b> to watch what happens.</div>}
          {hasSent && <Outcome lab={lab} result={result} />}
          {checkResult && <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle"><LessonTestsPanel result={checkResult} /></div>}
        </section>
      </div>
    </div>
  )
}
