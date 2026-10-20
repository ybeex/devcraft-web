'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Globe, KeyRound, Lock, RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getStorefrontKey, resetStorefront, storefrontBase } from '@/lib/api/storefront'

interface Preset { label: string; method: string; path: string; body?: string; auth?: boolean; pro?: boolean }
const PRESETS: Preset[] = [
  { label: 'List products', method: 'GET', path: '/products?limit=5' },
  { label: 'Search + sort', method: 'GET', path: '/products?q=laptop&sort=price&limit=5' },
  { label: 'Infinite scroll (cursor)', method: 'GET', path: '/products?limit=5&cursor=0' },
  { label: 'One product', method: 'GET', path: '/products/7' },
  { label: 'A retired product (410)', method: 'GET', path: '/products/6' },
  { label: 'Reviews', method: 'GET', path: '/products/7/reviews?limit=3' },
  { label: 'Categories', method: 'GET', path: '/categories' },
  { label: 'Search suggestions', method: 'GET', path: '/search/suggest?q=pro' },
  { label: 'Log in as the demo user', method: 'POST', path: '/auth/login', body: '{\n  "email": "demo@shop.test",\n  "password": "password123"\n}', pro: true },
  { label: 'Register', method: 'POST', path: '/auth/register', body: '{\n  "email": "you@example.com",\n  "name": "Your Name",\n  "password": "longenough1"\n}', pro: true },
  { label: 'My cart', method: 'GET', path: '/cart', auth: true, pro: true },
  { label: 'Add to cart', method: 'POST', path: '/cart/items', body: '{ "productId": 7, "quantity": 2 }', auth: true, pro: true },
  { label: 'Apply a coupon', method: 'POST', path: '/cart/coupon', body: '{ "code": "WELCOME10" }', auth: true, pro: true },
  { label: 'Checkout', method: 'POST', path: '/checkout', body: '{\n  "address": { "line1": "12 Marina Road", "city": "Lagos", "country": "Nigeria" },\n  "paymentMethod": "card",\n  "cardNumber": "4242 4242 4242 4242"\n}', auth: true, pro: true },
  { label: 'My orders', method: 'GET', path: '/orders', auth: true, pro: true },
]

interface Reply { status: number; ms: number; headers: Array<[string, string]>; body: string; isImage: boolean; error?: string }

function useCopy(): [string | null, (id: string, text: string) => void] {
  const [done, setDone] = useState<string | null>(null)
  return [done, (id, text) => { void navigator.clipboard?.writeText(text); setDone(id); setTimeout(() => setDone(null), 1500) }]
}

export function StorefrontWorkspace() {
  const queryClient = useQueryClient()
  const { data: info, isLoading, isError } = useQuery({ queryKey: ['storefront-key'], queryFn: getStorefrontKey, staleTime: 10 * 60_000 })
  const base = useMemo(() => storefrontBase(), [])
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/products?limit=5')
  const [body, setBody] = useState('')
  const [token, setToken] = useState('')
  const [delay, setDelay] = useState('0')
  const [fail, setFail] = useState('')
  const [flaky, setFlaky] = useState('0')
  const [busy, setBusy] = useState(false)
  const [reply, setReply] = useState<Reply | null>(null)
  const [copied, copy] = useCopy()
  const [resetting, setResetting] = useState(false)

  useEffect(() => { setReply(null) }, [method, path])

  const url = useMemo(() => {
    const u = new URL(base + (path.startsWith('/') ? path : `/${path}`))
    if (delay !== '0') u.searchParams.set('_delay', delay)
    if (fail) u.searchParams.set('_fail', fail)
    if (flaky !== '0') u.searchParams.set('_flaky', flaky)
    return u.toString()
  }, [base, path, delay, fail, flaky])

  const snippet = useMemo(() => {
    const lines = [`const res = await fetch('${url}', {`]
    if (method !== 'GET') lines.push(`  method: '${method}',`)
    const headers = [info?.key ? `    'X-Storefront-Key': '${info.key}',` : null, body.trim() ? `    'Content-Type': 'application/json',` : null, token ? `    Authorization: 'Bearer ${token}',` : null].filter(Boolean)
    if (headers.length) lines.push('  headers: {', ...(headers as string[]), '  },')
    if (body.trim()) lines.push(`  body: JSON.stringify(${body.replace(/\s*\n\s*/g, ' ').trim()}),`)
    lines.push('})', 'const json = await res.json()')
    return lines.join('\n')
  }, [url, method, body, token, info?.key])

  async function send() {
    setBusy(true)
    const started = performance.now()
    try {
      const headers: Record<string, string> = {}
      if (info?.key) headers['X-Storefront-Key'] = info.key
      if (token) headers.Authorization = `Bearer ${token}`
      if (body.trim()) headers['Content-Type'] = 'application/json'
      const res = await fetch(url, { method, headers, body: method !== 'GET' && body.trim() ? body : undefined })
      const ms = Math.round(performance.now() - started)
      const type = res.headers.get('content-type') ?? ''
      const raw = await res.text()
      let pretty = raw
      if (type.includes('json')) {
        try {
          const j = JSON.parse(raw) as { data?: { token?: string } }
          pretty = JSON.stringify(j, null, 2)
          if (j.data?.token) setToken(j.data.token)           // log in once, then try the cart
        } catch { /* leave raw */ }
      }
      setReply({ status: res.status, ms, headers: ['content-type', 'x-ratelimit-remaining', 'retry-after', 'idempotent-replayed'].flatMap((h) => (res.headers.get(h) ? [[h, res.headers.get(h)!] as [string, string]] : [])), body: pretty, isImage: type.includes('svg') })
    } catch {
      setReply({ status: 0, ms: Math.round(performance.now() - started), headers: [], body: '', isImage: false, error: 'The request never got an answer (network error or CORS). The API may be down.' })
    } finally { setBusy(false) }
  }

  async function reset() {
    if (!window.confirm('Wipe your practice shop? Accounts, carts and orders you created are removed.')) return
    setResetting(true)
    try { await resetStorefront(); setToken(''); await queryClient.invalidateQueries({ queryKey: ['storefront-key'] }) } finally { setResetting(false) }
  }

  if (isLoading) return <p className="mt-8 text-sm text-ghost">Loading…</p>
  if (isError || !info) return <p className="mt-8 text-sm text-error">Could not load the Storefront API details. Try again.</p>

  const tone = reply ? (reply.status >= 200 && reply.status < 300 ? 'text-success' : 'text-error') : ''
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><KeyRound size={14} /> {info.pro ? 'Your key' : 'Free taste'}</h2>
          {info.pro ? (
            <>
              <p className="mt-2 break-all rounded bg-raised px-2 py-1.5 font-mono text-[11px] text-ink" data-testid="storefront-key">{info.key}</p>
              <button onClick={() => copy('key', info.key ?? '')} className="mt-2 flex items-center gap-1 text-xs text-brand">{copied === 'key' ? <Check size={12} /> : <Copy size={12} />} Copy key</button>
              <p className="mt-3 text-xs text-dim">Send it as the <code className="font-mono">X-Storefront-Key</code> header. It unlocks your own private shop: accounts, carts and orders only you can see. {info.per_minute} requests a minute.</p>
              <p className="mt-2 text-xs text-dim">Demo login: <code className="font-mono">{info.demo_account?.email}</code> / <code className="font-mono">{info.demo_account?.password}</code>. Declined card: <code className="font-mono">{info.declined_card}</code>.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={reset} disabled={resetting}><RotateCcw size={13} /> Reset my shop</Button>
                <Link href="/playground/previews"><Button size="sm" variant="outline"><Globe size={13} /> My previews</Button></Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-xs text-dim">Without Pro you can read products, categories, reviews and search, {info.free_per_minute} requests a minute. Accounts, carts, checkout, orders and the browser lessons are part of Pro.</p>
              <Link href="/pro" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand"><Lock size={12} /> See Pro</Link>
            </>
          )}
        </section>
        <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Try a request</h2>
          <ul className="mt-2 flex flex-col">
            {PRESETS.map((p) => {
              const locked = p.pro && !info.pro
              return (
                <li key={p.label}>
                  <button disabled={locked} onClick={() => { setMethod(p.method); setPath(p.path); setBody(p.body ?? '') }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-dim hover:bg-raised hover:text-ink disabled:opacity-40">
                    <span className="w-10 shrink-0 font-mono text-[10px] font-bold text-ghost">{p.method}</span>{p.label}{locked && <Lock size={10} className="ml-auto" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
          <div className="flex gap-2">
            <select aria-label="Method" value={method} onChange={(e) => setMethod(e.target.value)} className="rounded border border-rim-subtle bg-canvas px-2 py-1.5 font-mono text-xs text-ink">
              {['GET', 'POST', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input aria-label="Path" value={path} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void send()}
              className="min-w-0 flex-1 rounded border border-rim-subtle bg-canvas px-2 py-1.5 font-mono text-xs text-ink" spellCheck={false} />
            <Button size="sm" onClick={send} disabled={busy}><Send size={13} /> {busy ? 'Sending…' : 'Send'}</Button>
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-ghost" title={url}>{url}</p>
          {method !== 'GET' && method !== 'DELETE' && (
            <textarea aria-label="Request body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} spellCheck={false} placeholder='{ "json": "body" }'
              className="mt-3 w-full rounded border border-rim-subtle bg-canvas p-2 font-mono text-xs text-ink" />
          )}
          <label className="mt-3 block text-[11px] text-ghost">Sign-in token (sent as Bearer; filled in for you after login)
            <input value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded border border-rim-subtle bg-canvas px-2 py-1.5 font-mono text-xs text-ink" spellCheck={false} />
          </label>
          <fieldset className="mt-3 grid grid-cols-3 gap-3">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ghost">Make it misbehave</legend>
            <label className="text-[11px] text-ghost">Slow
              <select value={delay} onChange={(e) => setDelay(e.target.value)} className="mt-1 w-full rounded border border-rim-subtle bg-canvas px-2 py-1.5 text-xs text-ink">
                <option value="0">No delay</option><option value="500">0.5 s</option><option value="1500">1.5 s</option><option value="3000">3 s</option>
              </select>
            </label>
            <label className="text-[11px] text-ghost">Always fail
              <select value={fail} onChange={(e) => setFail(e.target.value)} className="mt-1 w-full rounded border border-rim-subtle bg-canvas px-2 py-1.5 text-xs text-ink">
                <option value="">Works</option><option value="404">404</option><option value="429">429</option><option value="500">500</option><option value="503">503</option>
              </select>
            </label>
            <label className="text-[11px] text-ghost">Sometimes fail
              <select value={flaky} onChange={(e) => setFlaky(e.target.value)} className="mt-1 w-full rounded border border-rim-subtle bg-canvas px-2 py-1.5 text-xs text-ink">
                <option value="0">Never</option><option value="0.3">30%</option><option value="0.5">50%</option><option value="0.8">80%</option>
              </select>
            </label>
          </fieldset>
        </section>

        <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4" aria-live="polite">
          <h2 className="text-sm font-semibold text-ink">Response</h2>
          {!reply && <p className="mt-2 text-xs text-ghost">Press Send to see the response.</p>}
          {reply?.error && <p className="mt-2 text-xs text-error">{reply.error}</p>}
          {reply && !reply.error && (
            <>
              <p className="mt-2 text-xs"><span className={`font-mono font-bold ${tone}`} data-testid="storefront-status">{reply.status}</span> <span className="text-ghost">· {reply.ms} ms</span></p>
              {reply.headers.length > 0 && <p className="mt-1 font-mono text-[11px] text-ghost">{reply.headers.map(([k, v]) => `${k}: ${v}`).join('  ·  ')}</p>}
              {reply.isImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={url} alt="Product" className="mt-3 max-h-60 rounded" />
                : <pre className="mt-3 max-h-[28rem] overflow-auto rounded bg-canvas p-3 font-mono text-[12px] text-ink" data-testid="storefront-body">{reply.body || '(empty body)'}</pre>}
            </>
          )}
        </section>

        <section className="rounded-[var(--radius-md)] border border-rim-subtle bg-surface p-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">The same request in JavaScript</h2>
            <button onClick={() => copy('snippet', snippet)} className="flex items-center gap-1 text-xs text-brand">{copied === 'snippet' ? <Check size={12} /> : <Copy size={12} />} Copy</button></div>
          <pre className="mt-2 overflow-auto rounded bg-canvas p-3 font-mono text-[12px] text-ink">{snippet}</pre>
        </section>
      </div>
    </div>
  )
}
