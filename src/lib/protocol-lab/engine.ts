/**
 * Protocol lab engine. Pure and dependency-free so the SAME file runs in the API (which judges a learner's work) and in the
 * web app (which gives instant feedback while they type). tests/protocol-lab.test.ts fails if the two copies ever differ.
 *
 * A learner edits plain text, exactly what travels on the wire:
 *   http-request  a raw HTTP request, sent to a simulated server
 *   http-response a raw HTTP response, answering a fixed request
 *   dns-zone      a zone file for a domain, queried through a simulated resolver
 *   dns-resolve   the questions a resolver asks the root, TLD and authoritative servers, one per line
 * Nothing here touches a network. Everything is deterministic.
 */

export type LabKind = 'http-request' | 'http-response' | 'dns-zone' | 'dns-resolve'
export const LAB_KINDS: readonly LabKind[] = ['http-request', 'http-response', 'dns-zone', 'dns-resolve']

export interface Diag { line: number; level: 'error' | 'warning'; message: string }
/** One arrow in the sequence diagram. `from`/`to` are actor names; `kind` picks the colour. */
export interface TraceStep { from: string; to: string; label: string; detail?: string; kind: 'request' | 'response' | 'query' | 'answer' | 'referral' | 'note' | 'error' }
export interface LabResult { kind: LabKind; ok: boolean; errors: string[]; diagnostics: Diag[]; trace: TraceStep[]; [key: string]: unknown }

// ── helpers ────────────────────────────────────────────────────────────────
const norm = (t: string): string => t.replace(/\r\n?/g, '\n')
const bytes = (s: string): number => { let n = 0; for (const ch of s) { const c = ch.codePointAt(0)!; n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4 } return n }
const REASONS: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 415: 'Unsupported Media Type', 421: 'Misdirected Request', 422: 'Unprocessable Content', 429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable' }
const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const tryJson = (s: string): { ok: true; value: unknown } | { ok: false } => { try { return { ok: true, value: JSON.parse(s) } } catch { return { ok: false } } }
const decode = (s: string): string => { try { return decodeURIComponent(s.replace(/\+/g, ' ')) } catch { return s } }

// ── HTTP messages ──────────────────────────────────────────────────────────
export interface HttpMessage { startLine: string; headers: Record<string, string>; headerList: Array<[string, string]>; body: string; hasBlank: boolean }

/** Splits a raw message into start line, headers and body. Problems are appended to `diags`. */
export function parseMessage(text: string, diags: Diag[]): HttpMessage {
  const lines = norm(text).split('\n')
  let i = 0
  while (i < lines.length && lines[i]!.trim() === '') i++
  const startLine = (lines[i] ?? '').trim()
  const headers: Record<string, string> = {}, headerList: Array<[string, string]> = []
  let n = i + 1, hasBlank = false
  for (; n < lines.length; n++) {
    const raw = lines[n]!
    if (raw.trim() === '') { hasBlank = true; n++; break }
    const c = raw.indexOf(':')
    if (c <= 0) { diags.push({ line: n + 1, level: 'error', message: `"${raw.trim().slice(0, 30)}" is not a header. A header is a name, a colon and a value, like Host: shop.devcraft.dev. Headers end at the first empty line, so put an empty line before the body.` }); continue }
    const name = raw.slice(0, c)
    if (/\s/.test(name)) { diags.push({ line: n + 1, level: 'error', message: `A header name cannot contain spaces ("${name}"). Write the name, then the colon straight after it.` }); continue }
    const value = raw.slice(c + 1).trim()
    headerList.push([name, value]); headers[name.toLowerCase()] = headers[name.toLowerCase()] ? `${headers[name.toLowerCase()]}, ${value}` : value
  }
  const body = lines.slice(n).join('\n').replace(/\n+$/, '')
  return { startLine, headers, headerList, body, hasBlank }
}

export interface ParsedRequest extends HttpMessage { method: string; target: string; path: string; query: Record<string, string>; queryList: Array<[string, string]>; version: string }

export function parseRequest(text: string): { request: ParsedRequest; diagnostics: Diag[] } {
  const diagnostics: Diag[] = []
  const m = parseMessage(text, diagnostics)
  const startAt = Math.max(1, norm(text).split('\n').findIndex((l) => l.trim() !== '') + 1)
  const parts = m.startLine.split(/\s+/).filter(Boolean)
  let method = '', target = '', version = ''
  if (!m.startLine) diagnostics.push({ line: 1, level: 'error', message: 'The request is empty. The first line is the request line: a method, a path and the protocol version, such as GET /products HTTP/1.1.' })
  else if (parts.length !== 3) diagnostics.push({ line: startAt, level: 'error', message: `The request line needs exactly three parts separated by spaces (method, path, version), but this one has ${parts.length}.` })
  else {
    ;[method, target, version] = parts as [string, string, string]
    if (!METHODS.includes(method)) diagnostics.push({ line: startAt, level: 'error', message: METHODS.includes(method.toUpperCase()) ? `Methods are written in capital letters: ${method.toUpperCase()}, not ${method}.` : `"${method}" is not an HTTP method this server knows. Use one of ${METHODS.join(', ')}.` })
    if (!target.startsWith('/')) diagnostics.push({ line: startAt, level: 'error', message: `The target must start with a slash, such as /products. A full URL or a bare word is not a path (got "${target}").` })
    if (!/^HTTP\/\d(\.\d)?$/.test(version)) diagnostics.push({ line: startAt, level: 'error', message: `The version must look like HTTP/1.1 (got "${version}").` })
  }
  const q = target.indexOf('?')
  const path = q >= 0 ? target.slice(0, q) : target
  const queryList: Array<[string, string]> = [], query: Record<string, string> = {}
  if (q >= 0) for (const pair of target.slice(q + 1).split('&').filter(Boolean)) { const e = pair.indexOf('='); const k = decode(e >= 0 ? pair.slice(0, e) : pair), v = decode(e >= 0 ? pair.slice(e + 1) : ''); queryList.push([k, v]); query[k] = v }
  if (m.startLine && version === 'HTTP/1.1' && !('host' in m.headers)) diagnostics.push({ line: startAt, level: 'error', message: 'HTTP/1.1 requires a Host header: one server can host many sites, and Host says which one you mean. Add Host: shop.devcraft.dev.' })
  checkLength(m, diagnostics, norm(text).split('\n').length, true)
  return { request: { ...m, method, target, path, query, queryList, version }, diagnostics }
}

function checkLength(m: HttpMessage, diags: Diag[], lastLine: number, isRequest: boolean): void {
  const cl = m.headers['content-length']
  const size = bytes(m.body)
  if (cl !== undefined) {
    if (!/^\d+$/.test(cl)) diags.push({ line: lastLine, level: 'error', message: `Content-Length must be a whole number of bytes (got "${cl}").` })
    else if (Number(cl) !== size) diags.push({ line: lastLine, level: 'error', message: `Content-Length says ${cl} but the body is ${size} byte${size === 1 ? '' : 's'}. The receiver reads exactly ${cl} bytes, so a wrong number cuts the body short or waits for bytes that never come.` })
  } else if (size > 0 && (isRequest || !('transfer-encoding' in m.headers))) diags.push({ line: lastLine, level: 'error', message: `There is a body of ${size} bytes but no Content-Length header, so the receiver cannot know where the message ends. Add Content-Length: ${size}.` })
  if (size > 0 && !m.hasBlank) diags.push({ line: lastLine, level: 'error', message: 'A body must come after an empty line that ends the headers.' })
}

export interface ParsedResponse extends HttpMessage { version: string; status: number; reason: string }

export function parseResponse(text: string): { response: ParsedResponse; diagnostics: Diag[] } {
  const diagnostics: Diag[] = []
  const m = parseMessage(text, diagnostics)
  const startAt = Math.max(1, norm(text).split('\n').findIndex((l) => l.trim() !== '') + 1)
  const mm = /^(HTTP\/\d(?:\.\d)?)\s+(\d{3})(?:\s+(.*))?$/.exec(m.startLine)
  let version = '', status = 0, reason = ''
  if (!m.startLine) diagnostics.push({ line: 1, level: 'error', message: 'The response is empty. The first line is the status line: the version, a three-digit status code and a reason, such as HTTP/1.1 200 OK.' })
  else if (!mm) diagnostics.push({ line: startAt, level: 'error', message: `The status line must be the version, a three-digit status code and a short reason, like HTTP/1.1 200 OK (got "${m.startLine.slice(0, 40)}").` })
  else { version = mm[1]!; status = Number(mm[2]); reason = (mm[3] ?? '').trim(); if (status < 100 || status > 599) diagnostics.push({ line: startAt, level: 'error', message: `${status} is not a status code in use (they run 100 to 599).` }); if (!reason) diagnostics.push({ line: startAt, level: 'warning', message: `Add the reason after the code: ${status} ${REASONS[status] ?? '…'}.` }) }
  checkLength(m, diagnostics, norm(text).split('\n').length, false)
  return { response: { ...m, version, status, reason }, diagnostics }
}

const rawResponse = (status: number, headers: Record<string, string>, body: string): string => `HTTP/1.1 ${status} ${REASONS[status] ?? ''}\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n')}${body ? `\n\n${body}` : ''}`.trim()

export interface Route { method: string; path: string; status?: number; json?: unknown; text?: string; headers?: Record<string, string>; requireJson?: boolean; requireFields?: string[]; requireHeaders?: Record<string, string>; failStatus?: number }
export interface HttpServerScenario { host?: string; routes: Route[] }
export interface HttpRequestScenario { server: HttpServerScenario; goal?: string }
export interface HttpResponseScenario { request: string; client?: string }

const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const a = pattern.split('/').filter(Boolean), b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) { if (a[i]!.startsWith(':')) params[a[i]!.slice(1)] = decode(b[i]!); else if (a[i] !== b[i]) return null }
  return params
}
const fill = (v: unknown, params: Record<string, string>): unknown => typeof v === 'string' ? v.replace(/\{\{(\w+)\}\}/g, (_, k: string) => params[k] ?? '') : Array.isArray(v) ? v.map((x) => fill(x, params)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x, params)])) : v

/** What the simulated server does with a request. Real servers do exactly this, in this order. */
export function serve(req: ParsedRequest, malformed: boolean, server: HttpServerScenario): { status: number; headers: Record<string, string>; body: string; note: string } {
  const json = (status: number, value: unknown, extra: Record<string, string> = {}, note = '') => ({ status, headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(value), note })
  if (malformed) return { status: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Bad Request: the server could not understand the request', note: 'The request is malformed, so the server refuses it before looking at the path.' }
  if (server.host && (req.headers['host'] ?? '').replace(/:\d+$/, '') !== server.host) return json(404, { error: `No site is served for host "${req.headers['host'] ?? ''}"` }, {}, `The Host header decides which site answers. This server only knows ${server.host}.`)
  const sameMethod = server.routes.filter((r) => r.method === req.method)
  let hit: { route: Route; params: Record<string, string> } | null = null
  for (const r of sameMethod) { const p = matchPath(r.path, req.path); if (p) { hit = { route: r, params: p }; break } }
  if (!hit) {
    const other = server.routes.filter((r) => matchPath(r.path, req.path))
    if (other.length) { const allow = [...new Set(other.map((r) => r.method))].join(', '); return json(405, { error: `${req.method} is not allowed on ${req.path}`, allowed: allow.split(', ') }, { Allow: allow }, `The path exists, but not for the method ${req.method}.`) }
    return json(404, { error: 'Not found' }, {}, `No route matches ${req.path}.`)
  }
  const { route, params } = hit
  for (const [h, prefix] of Object.entries(route.requireHeaders ?? {})) if (!(req.headers[h.toLowerCase()] ?? '').toLowerCase().startsWith(prefix.toLowerCase())) return json(route.failStatus ?? 401, { error: `A ${h} header starting with "${prefix}" is required` }, {}, `The route needs a ${h} header.`)
  if (route.requireJson) {
    if (!(req.headers['content-type'] ?? '').toLowerCase().includes('application/json')) return json(415, { error: 'Send the body as JSON with Content-Type: application/json' }, {}, 'The route only accepts JSON, and the Content-Type header does not say so.')
    const parsed = tryJson(req.body)
    if (!parsed.ok) return json(400, { error: 'The body is not valid JSON' }, {}, 'The body could not be parsed as JSON.')
    const missing = (route.requireFields ?? []).filter((f) => !parsed.value || typeof parsed.value !== 'object' || (parsed.value as Record<string, unknown>)[f] === undefined)
    if (missing.length) return json(422, { error: `Missing field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`, missing }, {}, 'The JSON is valid but incomplete.')
  }
  const status = route.status ?? 200
  if (route.text !== undefined) return { status, headers: { 'Content-Type': 'text/plain', ...(route.headers ?? {}) }, body: String(fill(route.text, params)), note: `Route ${route.method} ${route.path} matched.` }
  return json(status, fill(route.json ?? {}, params), route.headers ?? {}, `Route ${route.method} ${route.path} matched.`)
}

function runHttpRequest(scn: HttpRequestScenario, doc: string): LabResult {
  const { request, diagnostics } = parseRequest(doc)
  const malformed = diagnostics.some((d) => d.level === 'error')
  const host = request.headers['host'] ?? scn.server.host ?? 'server'
  const out = serve(request, malformed, scn.server)
  const trace: TraceStep[] = [
    { from: 'Client', to: 'Server', kind: malformed ? 'error' : 'request', label: malformed ? 'malformed request' : `${request.method} ${request.target}`, detail: host },
    { from: 'Server', to: 'Client', kind: out.status >= 400 ? 'error' : 'response', label: `${out.status} ${REASONS[out.status] ?? ''}`.trim(), detail: out.note },
  ]
  const respHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(out.headers)) respHeaders[k.toLowerCase()] = v
  const parsedBody = tryJson(out.body)
  const response = { status: out.status, reason: REASONS[out.status] ?? '', headers: respHeaders, body: out.body, json: parsedBody.ok ? parsedBody.value : null, raw: rawResponse(out.status, { ...out.headers, 'Content-Length': String(bytes(out.body)) }, out.body) }
  const errors = diagnostics.filter((d) => d.level === 'error').map((d) => d.message)
  return { kind: 'http-request', ok: errors.length === 0, errors, diagnostics, trace, request, response }
}

function runHttpResponse(scn: HttpResponseScenario, doc: string): LabResult {
  const { request, diagnostics: reqDiags } = parseRequest(scn.request)
  const { response, diagnostics } = parseResponse(doc)
  const ct = response.headers['content-type'] ?? ''
  const wantsJson = ct.toLowerCase().includes('application/json')
  const parsed = wantsJson && response.body ? tryJson(response.body) : null
  if (parsed && !parsed.ok) diagnostics.push({ line: norm(doc).split('\n').length, level: 'error', message: 'The Content-Type says JSON, but the body is not valid JSON, so the client will fail to read it.' })
  const errors = diagnostics.filter((d) => d.level === 'error').map((d) => d.message)
  const klass = response.status >= 500 ? 'server error' : response.status >= 400 ? 'client error' : response.status >= 300 ? 'redirect' : response.status >= 200 ? 'success' : response.status >= 100 ? 'informational' : 'invalid'
  const trace: TraceStep[] = [
    { from: 'Client', to: 'Server', kind: 'request', label: `${request.method} ${request.target}`, detail: request.headers['host'] ?? '' },
    { from: 'Server', to: 'Client', kind: errors.length ? 'error' : response.status >= 400 ? 'error' : 'response', label: response.status ? `${response.status} ${response.reason}`.trim() : 'unreadable response', detail: errors.length ? errors[0] : klass },
  ]
  return { kind: 'http-response', ok: errors.length === 0, errors, diagnostics, trace, request, response: { ...response, class: klass, json: parsed && parsed.ok ? parsed.value : null, contentLength: response.headers['content-length'] ?? null, bodyBytes: bytes(response.body) }, requestDiagnostics: reqDiags }
}

// ── DNS ────────────────────────────────────────────────────────────────────
export interface DnsRecord { name: string; ttl: number; type: string; value: string }
const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT']
const fqdn = (s: string): string => (s.endsWith('.') ? s : `${s}.`).toLowerCase()
const isIPv4 = (s: string): boolean => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s) && s.split('.').every((p) => Number(p) <= 255)

export function parseZone(text: string, defaultOrigin: string): { records: DnsRecord[]; diagnostics: Diag[]; origin: string } {
  const diagnostics: Diag[] = [], records: DnsRecord[] = []
  let origin = fqdn(defaultOrigin), ttl = 3600, last = origin
  norm(text).split('\n').forEach((raw, idx) => {
    const line = idx + 1
    const stripped = raw.replace(/;.*$/, '').trimEnd()
    if (!stripped.trim()) return
    const bad = (message: string, level: 'error' | 'warning' = 'error') => diagnostics.push({ line, level, message })
    const t = stripped.trim().split(/\s+/)
    if (t[0] === '$ORIGIN') { if (!t[1]) return bad('$ORIGIN needs a domain name, such as $ORIGIN devcraft.dev.'); origin = fqdn(t[1]); last = origin; return }
    if (t[0] === '$TTL') { if (!/^\d+$/.test(t[1] ?? '')) return bad('$TTL needs a number of seconds, such as $TTL 300.'); ttl = Number(t[1]); return }
    // A record line is: name [ttl] [IN] type value…  (a line that starts with a space repeats the previous name).
    const sameName = /^\s/.test(stripped)
    let i = 0
    let nameTok = sameName ? '' : t[i++]!
    let rtl = ttl
    if (/^\d+$/.test(t[i] ?? '')) rtl = Number(t[i++])
    if ((t[i] ?? '').toUpperCase() === 'IN') i++
    const type = (t[i++] ?? '').toUpperCase()
    const rest = t.slice(i)
    if (!type) return bad('A record needs a type after the name, such as A or CNAME.')
    if (!DNS_TYPES.includes(type)) return bad(`"${type}" is not a record type this lab supports. Use one of ${DNS_TYPES.join(', ')}.`)
    if (nameTok === '') nameTok = last; else nameTok = nameTok === '@' ? origin : nameTok.endsWith('.') ? nameTok : `${nameTok}.${origin}`
    const name = nameTok.toLowerCase(); last = name
    let value = rest.join(' ')
    if (!value) return bad(`The ${type} record has no value.`)
    if (type === 'A' && !isIPv4(value)) return bad(`"${value}" is not an IPv4 address. An A record holds four numbers from 0 to 255 separated by dots.`)
    if (type === 'AAAA' && !value.includes(':')) return bad(`"${value}" is not an IPv6 address. An AAAA record holds an address such as 2001:db8::1.`)
    if (type === 'CNAME' || type === 'NS') {
      if (rest.length !== 1) return bad(`A ${type} record holds exactly one name.`)
      if (!value.endsWith('.')) { const full = `${value}.${origin}`.toLowerCase(); bad(`"${value}" has no trailing dot, so it is relative to ${origin} and really means ${full} To mean the name ${value} itself, end it with a dot: ${value}.`, 'warning'); value = full } else value = value.toLowerCase()
    }
    if (type === 'MX') {
      if (rest.length !== 2 || !/^\d+$/.test(rest[0]!)) return bad('An MX record is a priority number and a mail server name, such as MX 10 mail.devcraft.dev.')
      value = `${rest[0]} ${rest[1]!.endsWith('.') ? rest[1]!.toLowerCase() : `${rest[1]}.${origin}`.toLowerCase()}`
    }
    if (type === 'TXT') value = value.replace(/^"(.*)"$/, '$1')
    records.push({ name, ttl: rtl, type, value })
  })
  const names = new Set(records.map((r) => r.name))
  for (const n of names) { const here = records.filter((r) => r.name === n); if (here.some((r) => r.type === 'CNAME') && here.length > 1) diagnostics.push({ line: 1, level: 'error', message: `${n} has a CNAME and other records. A name that is an alias cannot also hold its own data, so resolvers would not know which to believe.` }) }
  return { records, diagnostics, origin }
}

export interface DnsQuery { name: string; type: string }
export interface DnsZoneScenario { origin: string; queries: DnsQuery[]; /** Records of other zones, keyed by name, so CNAMEs can point outside the learner's zone. */ world?: Record<string, DnsRecord[]> }

function resolveInZone(zone: DnsRecord[], world: Record<string, DnsRecord[]>, origin: string, q: DnsQuery) {
  const trace: TraceStep[] = [
    { from: 'Browser', to: 'Resolver', kind: 'query', label: `${q.name} ${q.type}?`, detail: 'Your computer asks its resolver.' },
    { from: 'Resolver', to: 'Root', kind: 'query', label: `${q.name} ${q.type}?`, detail: 'Starts at the top of the tree.' },
    { from: 'Root', to: 'Resolver', kind: 'referral', label: `ask the .${origin.replace(/\.$/, '').split('.').pop()} servers`, detail: 'The root only knows who runs each top-level domain.' },
    { from: 'Resolver', to: 'TLD', kind: 'query', label: `${q.name} ${q.type}?` },
    { from: 'TLD', to: 'Resolver', kind: 'referral', label: `ask ${origin}'s name servers`, detail: 'The TLD knows which servers are in charge of the domain.' },
  ]
  const answers: DnsRecord[] = []
  let name = fqdn(q.name), rcode = 'NOERROR', hops = 0
  let server = 'Your zone'
  while (hops++ < 8) {
    const inZone = name === origin || name.endsWith(`.${origin}`)
    const pool = inZone ? zone : world[name] ?? []
    if (!inZone) { server = 'Other zone'; trace.push({ from: 'Resolver', to: 'Other zone', kind: 'query', label: `${name} ${q.type}?`, detail: 'The alias points outside your domain, so the resolver starts again for the new name.' }) }
    else trace.push({ from: 'Resolver', to: 'Your zone', kind: 'query', label: `${name} ${q.type}?`, detail: hops === 1 ? 'This is your name server, the authority.' : 'Following the alias inside your zone.' })
    const exact = pool.filter((r) => r.name === name)
    const direct = exact.filter((r) => r.type === q.type)
    if (direct.length) { answers.push(...direct); trace.push({ from: server, to: 'Resolver', kind: 'answer', label: direct.map((r) => r.value).join(', '), detail: `ttl ${direct[0]!.ttl}s` }); break }
    const cname = exact.find((r) => r.type === 'CNAME')
    if (cname && q.type !== 'CNAME') { answers.push(cname); trace.push({ from: server, to: 'Resolver', kind: 'referral', label: `${name} is an alias of ${cname.value}`, detail: 'A CNAME says: ask for this other name instead.' }); name = cname.value; continue }
    if (exact.length || pool.length === 0 && !inZone) { rcode = exact.length ? 'NOERROR' : 'NXDOMAIN'; trace.push({ from: server, to: 'Resolver', kind: 'error', label: exact.length ? `no ${q.type} record` : 'NXDOMAIN', detail: exact.length ? 'The name exists but has no record of that type (NODATA).' : 'That name does not exist.' }); break }
    rcode = 'NXDOMAIN'; trace.push({ from: server, to: 'Resolver', kind: 'error', label: 'NXDOMAIN', detail: 'That name does not exist.' }); break
  }
  if (hops > 8) rcode = 'SERVFAIL'
  trace.push({ from: 'Resolver', to: 'Browser', kind: answers.length && rcode === 'NOERROR' && answers[answers.length - 1]!.type === q.type ? 'answer' : 'error', label: answers.length && rcode === 'NOERROR' ? (answers.filter((a) => a.type === q.type).map((a) => a.value).join(', ') || rcode) : rcode, detail: 'The resolver also keeps the answer for its ttl.' })
  return { name: q.name, type: q.type, rcode, answers, trace }
}

function runDnsZone(scn: DnsZoneScenario, doc: string): LabResult {
  const { records, diagnostics } = parseZone(doc, scn.origin)
  const queries = scn.queries.map((q) => resolveInZone(records, scn.world ?? {}, fqdn(scn.origin), q))
  const errors = diagnostics.filter((d) => d.level === 'error').map((d) => d.message)
  return { kind: 'dns-zone', ok: errors.length === 0, errors, diagnostics, trace: queries[0]?.trace ?? [], records, queries }
}

export interface DnsServerDef { ip: string; records?: DnsRecord[]; delegations?: Record<string, string> }
export interface DnsResolveScenario { target: DnsQuery; start: string; servers: Record<string, DnsServerDef> }

function runDnsResolve(scn: DnsResolveScenario, doc: string): LabResult {
  const diagnostics: Diag[] = [], trace: TraceStep[] = []
  const known = new Set([scn.start])
  const steps: Array<{ server: string; name: string; type: string; outcome: string; answer?: string; referral?: string }> = []
  let resolved: string | null = null, wanted = fqdn(scn.target.name)
  trace.push({ from: 'Resolver', to: 'Resolver', kind: 'note', label: `Goal: ${scn.target.name} ${scn.target.type}`, detail: `Start by asking ${scn.start}` })
  norm(doc).split('\n').forEach((raw, idx) => {
    const line = idx + 1, text = raw.replace(/;.*$|#.*$/, '').trim()
    if (!text) return
    const m = /^ask\s+(\S+)\s+(\S+)\s+(\S+)$/i.exec(text)
    if (!m) return void diagnostics.push({ line, level: 'error', message: 'Write each question as: ask <server> <name> <type>, for example ask root shop.devcraft.dev A.' })
    const [, server, nameRaw, typeRaw] = m as unknown as [string, string, string, string]
    const type = typeRaw.toUpperCase(), name = fqdn(nameRaw)
    const def = scn.servers[server]
    if (!def) return void diagnostics.push({ line, level: 'error', message: `There is no server called "${server}". The servers are: ${Object.keys(scn.servers).join(', ')}.` })
    if (!known.has(server)) return void diagnostics.push({ line, level: 'error', message: `You do not know where ${server} is yet. A resolver can only ask a server that an earlier answer pointed to (a referral), or the one it starts with.` })
    trace.push({ from: 'Resolver', to: server, kind: 'query', label: `${name} ${type}?` })
    if (resolved !== null) { diagnostics.push({ line, level: 'warning', message: 'You already have the answer. A resolver stops here.' }) }
    const hit = (def.records ?? []).filter((r) => r.name === name && r.type === type)
    const alias = (def.records ?? []).find((r) => r.name === name && r.type === 'CNAME')
    if (hit.length) { const v = hit.map((r) => r.value).join(', '); steps.push({ server, name, type, outcome: 'answer', answer: v }); trace.push({ from: server, to: 'Resolver', kind: 'answer', label: v, detail: `ttl ${hit[0]!.ttl}s` }); if (fqdn(name) === wanted && type === scn.target.type) resolved = hit[0]!.value; return }
    if (alias && type !== 'CNAME') { steps.push({ server, name, type, outcome: 'alias', answer: alias.value }); trace.push({ from: server, to: 'Resolver', kind: 'referral', label: `alias of ${alias.value}`, detail: 'Ask again for the new name.' }); wanted = alias.value; return }
    const dl = Object.entries(def.delegations ?? {}).filter(([suffix]) => name === suffix || name.endsWith(`.${suffix}`) || suffix === '.').sort((a, b) => b[0].length - a[0].length)[0]
    if (dl) { known.add(dl[1]); steps.push({ server, name, type, outcome: 'referral', referral: dl[1] }); trace.push({ from: server, to: 'Resolver', kind: 'referral', label: `ask ${dl[1]} (${scn.servers[dl[1]]?.ip ?? '?'})`, detail: `${server} does not hold ${name} but knows who is in charge of ${dl[0] === '.' ? 'the next level' : dl[0]}.` }); return }
    steps.push({ server, name, type, outcome: 'nxdomain' }); trace.push({ from: server, to: 'Resolver', kind: 'error', label: 'NXDOMAIN', detail: 'This server has no such name and no one to refer you to.' })
  })
  const errors = diagnostics.filter((d) => d.level === 'error').map((d) => d.message)
  if (resolved !== null) trace.push({ from: 'Resolver', to: 'Browser', kind: 'answer', label: resolved, detail: 'Resolved.' })
  return { kind: 'dns-resolve', ok: errors.length === 0, errors, diagnostics, trace, steps, resolved, queries: steps.length, referrals: steps.filter((s) => s.outcome === 'referral').length, serversAsked: [...new Set(steps.map((s) => s.server))] }
}

/** Runs one lab. Never throws: a scenario or document problem becomes a diagnostic. */
export function runLab(kind: LabKind, scenario: unknown, doc: string): LabResult {
  try {
    if (kind === 'http-request') return runHttpRequest(scenario as HttpRequestScenario, doc)
    if (kind === 'http-response') return runHttpResponse(scenario as HttpResponseScenario, doc)
    if (kind === 'dns-zone') return runDnsZone(scenario as DnsZoneScenario, doc)
    return runDnsResolve(scenario as DnsResolveScenario, doc)
  } catch (e) {
    const message = `The lab could not run: ${e instanceof Error ? e.message : 'unknown problem'}`
    return { kind, ok: false, errors: [message], diagnostics: [{ line: 1, level: 'error', message }], trace: [] }
  }
}

// ── checks ─────────────────────────────────────────────────────────────────
export interface Expectation { path: string; op: string; value: unknown; raw: string }
export interface CheckSpec { name: string; hint: string | null; expects: Expectation[] }
const OPS = ['==', '!=', '>=', '<=', 'contains', 'matches', 'exists', 'missing']

/**
 *   check: the request reaches the products route
 *   hint: Which method asks to read something?
 *   expect: response.status == 200
 *   expect: response.headers.content-type contains application/json
 */
export function parseChecks(text: string): CheckSpec[] {
  const out: CheckSpec[] = []
  for (const raw of norm(text).split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const c = /^check:\s*(.+)$/.exec(line)
    if (c) { out.push({ name: c[1]!.trim(), hint: null, expects: [] }); continue }
    const cur = out[out.length - 1]
    if (!cur) throw new Error(`Line "${line.slice(0, 40)}" appears before any "check:" line`)
    const h = /^hint:\s*(.+)$/.exec(line)
    if (h) { cur.hint = h[1]!.trim(); continue }
    const e = /^expect:\s*(\S+)\s+(==|!=|>=|<=|contains|matches|exists|missing)(?:\s+([\s\S]*))?$/.exec(line)
    if (!e) throw new Error(`Cannot read "${line.slice(0, 60)}": write expect: <path> <${OPS.join('|')}> <value>`)
    const op = e[2]!, rawValue = (e[3] ?? '').trim()
    if ((op === 'exists' || op === 'missing') !== (rawValue === '')) throw new Error(`"${line.slice(0, 60)}": ${op === 'exists' || op === 'missing' ? `${op} takes no value` : `${op} needs a value`}`)
    if (op === 'matches') { try { new RegExp(rawValue) } catch { throw new Error(`"${line.slice(0, 60)}": invalid pattern`) } }
    let value: unknown = rawValue
    if (rawValue) { const j = tryJson(rawValue); if (j.ok) value = j.value }
    cur.expects.push({ path: e[1]!, op, value, raw: line.replace(/^expect:\s*/, '') })
  }
  for (const c of out) if (c.expects.length === 0) throw new Error(`check "${c.name}" has no expect: lines`)
  return out
}

export function getPath(root: unknown, path: string): unknown {
  let cur: unknown = root
  for (const seg of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (seg === 'length') { if (Array.isArray(cur) || typeof cur === 'string') { cur = cur.length; continue } }
    if (Array.isArray(cur)) { cur = cur[Number(seg)]; continue }
    if (typeof cur === 'object') { cur = (cur as Record<string, unknown>)[seg]; continue }
    return undefined
  }
  return cur
}

const show = (v: unknown): string => v === undefined ? 'nothing' : typeof v === 'string' ? `"${v.length > 60 ? `${v.slice(0, 57)}…` : v}"` : JSON.stringify(v)?.slice(0, 80) ?? String(v)

export function evaluate(result: LabResult, e: Expectation): { ok: boolean; actual: unknown } {
  const actual = getPath(result, e.path)
  switch (e.op) {
    case 'exists': return { ok: actual !== undefined && actual !== null && actual !== '', actual }
    case 'missing': return { ok: actual === undefined || actual === null || actual === '', actual }
    case '==': return { ok: JSON.stringify(actual) === JSON.stringify(e.value) || String(actual) === String(e.value), actual }
    case '!=': return { ok: !(JSON.stringify(actual) === JSON.stringify(e.value) || String(actual) === String(e.value)), actual }
    case '>=': return { ok: typeof actual === 'number' && actual >= Number(e.value), actual }
    case '<=': return { ok: typeof actual === 'number' && actual <= Number(e.value), actual }
    case 'contains': return { ok: Array.isArray(actual) ? actual.some((x) => String(x) === String(e.value)) : typeof actual === 'string' && actual.toLowerCase().includes(String(e.value).toLowerCase()), actual }
    case 'matches': return { ok: typeof actual === 'string' && new RegExp(String(e.value), 'i').test(actual), actual }
    default: return { ok: false, actual }
  }
}

export interface CheckOutcome { name: string; passed: boolean; reason?: string }

/** Judges a learner's document against a lesson's checks. The reason names what was found, never the answer. */
export function runChecks(kind: LabKind, scenario: unknown, doc: string, checks: string): CheckOutcome[] {
  const result = runLab(kind, scenario, doc)
  return parseChecks(checks).map((c) => {
    const bad = c.expects.map((e) => ({ e, r: evaluate(result, e) })).find((x) => !x.r.ok)
    if (!bad) return { name: c.name, passed: true }
    return { name: c.name, passed: false, reason: `${c.hint ? `${c.hint} ` : ''}Expected ${bad.e.path} ${bad.e.op}${bad.e.op === 'exists' || bad.e.op === 'missing' ? '' : ` ${show(bad.e.value)}`}, but it was ${show(bad.r.actual)}.` }
  })
}
