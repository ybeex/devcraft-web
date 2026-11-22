/**
 * The shape of a ```visual block in lesson text, and the one function that validates it. Pure and dependency-free: the web app
 * renders the result, and the API's curriculum validation runs the same function so a malformed diagram stops the seed
 * instead of reaching a learner. tests/protocol-lab.test.ts fails if the two copies differ.
 */
export type Tone = 'brand' | 'info' | 'success' | 'warning' | 'error' | 'muted'
export const TONES: readonly Tone[] = ['brand', 'info', 'success', 'warning', 'error', 'muted']
export type SeqKind = 'request' | 'response' | 'query' | 'answer' | 'referral' | 'note' | 'error'
export const SEQ_KINDS: readonly SeqKind[] = ['request', 'response', 'query', 'answer', 'referral', 'note', 'error']

export type VisualSpec =
  | { type: 'sequence'; title?: string; actors?: string[]; steps: Array<{ from: string; to: string; label: string; detail?: string; kind?: SeqKind }> }
  | { type: 'url'; title?: string; parts: Array<{ text: string; name: string; note: string; tone?: Tone }> }
  | { type: 'flow'; title?: string; direction?: 'row' | 'column'; steps: Array<{ title: string; note?: string; tone?: Tone }> }
  | { type: 'layers'; title?: string; layers: Array<{ title: string; note?: string; tone?: Tone }> }
  | { type: 'lanes'; title?: string; unit?: string; max?: number; lanes: Array<{ name: string; blocks: Array<{ start: number; len: number; label: string; tone?: Tone; note?: string }> }> }
  | { type: 'tree'; title?: string; root: TreeNode }
  | { type: 'commits'; title?: string; commits: Array<{ id: string; msg?: string; branch: string; parents?: string[] }>; refs?: Array<{ name: string; at: string }> }
export interface TreeNode { label: string; note?: string; tone?: Tone; children?: TreeNode[] }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max = 160): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
const tone = (v: unknown): boolean => v === undefined || (TONES as readonly unknown[]).includes(v)

export function parseVisualSpec(text: string): { spec: VisualSpec | null; error: string | null } {
  let v: unknown
  try { v = JSON.parse(text) } catch (e) { return { spec: null, error: `the visual is not valid JSON (${e instanceof Error ? e.message : 'parse error'})` } }
  const fail = (error: string) => ({ spec: null, error })
  if (!isObj(v) || typeof v['type'] !== 'string') return fail('a visual needs a "type"')
  if (v['title'] !== undefined && !str(v['title'])) return fail('"title" must be a short string')
  const list = (key: string, min: number, max: number): unknown[] | null => { const a = v[key]; return Array.isArray(a) && a.length >= min && a.length <= max ? a : null }
  switch (v['type']) {
    case 'sequence': {
      const steps = list('steps', 1, 14); if (!steps) return fail('a sequence needs 1-14 "steps"')
      for (const [i, s] of steps.entries()) {
        if (!isObj(s) || !str(s['from'], 30) || !str(s['to'], 30) || !str(s['label'], 80)) return fail(`sequence step ${i + 1} needs short "from", "to" and "label"`)
        if (s['detail'] !== undefined && !str(s['detail'], 300)) return fail(`sequence step ${i + 1}: "detail" must be a string of at most 300 characters`)
        if (s['kind'] !== undefined && !(SEQ_KINDS as readonly unknown[]).includes(s['kind'])) return fail(`sequence step ${i + 1}: unknown kind "${String(s['kind'])}"`)
      }
      const actors = v['actors']
      if (actors !== undefined && (!Array.isArray(actors) || actors.length < 2 || actors.length > 5 || !actors.every((a) => str(a, 30)))) return fail('"actors" must be 2-5 short names')
      const named = (steps as Array<{ from: string; to: string }>).flatMap((s) => [s.from, s.to])
      if (Array.isArray(actors)) { const missing = named.find((n) => !actors.includes(n)); if (missing) return fail(`a step uses "${missing}", which is not in "actors"`) }
      else if (new Set(named).size > 5) return fail('a sequence can show at most 5 actors')
      return { spec: v as unknown as VisualSpec, error: null }
    }
    case 'url': {
      const parts = list('parts', 2, 10); if (!parts) return fail('a url visual needs 2-10 "parts"')
      for (const [i, p] of parts.entries()) if (!isObj(p) || typeof p['text'] !== 'string' || !p['text'] || !str(p['name'], 30) || !str(p['note'], 300) || !tone(p['tone'])) return fail(`url part ${i + 1} needs "text", "name" and "note"`)
      return { spec: v as unknown as VisualSpec, error: null }
    }
    case 'flow': case 'layers': {
      const key = v['type'] === 'flow' ? 'steps' : 'layers'
      const items = list(key, 2, 9); if (!items) return fail(`a ${v['type']} needs 2-9 "${key}"`)
      for (const [i, s] of items.entries()) if (!isObj(s) || !str(s['title'], 50) || (s['note'] !== undefined && !str(s['note'], 300)) || !tone(s['tone'])) return fail(`${v['type']} item ${i + 1} needs a short "title" (and optionally a "note")`)
      if (v['direction'] !== undefined && v['direction'] !== 'row' && v['direction'] !== 'column') return fail('"direction" must be "row" or "column"')
      return { spec: v as unknown as VisualSpec, error: null }
    }
    case 'lanes': {
      const lanes = list('lanes', 1, 6); if (!lanes) return fail('lanes needs 1-6 "lanes"')
      let end = 0
      for (const [i, l] of lanes.entries()) {
        if (!isObj(l) || !str(l['name'], 40) || !Array.isArray(l['blocks']) || l['blocks'].length > 14) return fail(`lane ${i + 1} needs a "name" and up to 14 "blocks"`)
        for (const b of l['blocks'] as unknown[]) {
          if (!isObj(b) || typeof b['start'] !== 'number' || typeof b['len'] !== 'number' || b['start'] < 0 || b['len'] <= 0 || !str(b['label'], 40) || !tone(b['tone'])) return fail(`lane ${i + 1} has a block that needs a "start" of 0 or more, a "len" above 0 and a short "label"`)
          end = Math.max(end, b['start'] + b['len'])
        }
      }
      if (v['max'] !== undefined && (typeof v['max'] !== 'number' || v['max'] < end)) return fail('"max" must be a number at least as large as the last block ends')
      return { spec: v as unknown as VisualSpec, error: null }
    }
    case 'tree': {
      let count = 0
      const walk = (n: unknown, depth: number): string | null => {
        if (!isObj(n) || !str(n['label'], 60) || (n['note'] !== undefined && !str(n['note'], 300)) || !tone(n['tone'])) return 'every tree node needs a short "label"'
        if (++count > 40) return 'a tree can have at most 40 nodes'
        if (n['children'] !== undefined) { if (!Array.isArray(n['children']) || depth >= 5) return 'tree "children" must be a list, at most 5 levels deep'; for (const c of n['children']) { const e = walk(c, depth + 1); if (e) return e } }
        return null
      }
      const e = walk(v['root'], 0); return e ? fail(e) : { spec: v as unknown as VisualSpec, error: null }
    }
    case 'commits': {
      const commits = list('commits', 1, 14); if (!commits) return fail('a commits graph needs 1-14 "commits"')
      const ids = new Set<string>(), branches = new Set<string>()
      for (const [i, c] of commits.entries()) {
        if (!isObj(c) || !str(c['id'], 12) || !str(c['branch'], 30) || (c['msg'] !== undefined && !str(c['msg'], 40))) return fail(`commit ${i + 1} needs a short "id" and a "branch"`)
        if (ids.has(c['id'])) return fail(`commit id "${c['id']}" is used twice`)
        if (c['parents'] !== undefined) { if (!Array.isArray(c['parents']) || c['parents'].length > 2 || !c['parents'].every((p) => typeof p === 'string' && ids.has(p))) return fail(`commit "${c['id']}": "parents" must name up to two EARLIER commits`) }
        ids.add(c['id']); branches.add(c['branch'])
      }
      if (branches.size > 4) return fail('a commits graph can show at most 4 branches')
      const refs = v['refs']
      if (refs !== undefined) {
        if (!Array.isArray(refs) || refs.length > 6) return fail('"refs" must be a list of at most 6 labels')
        const names = new Set(refs.map((r) => (isObj(r) ? r['name'] : null)))
        for (const r of refs) if (!isObj(r) || !str(r['name'], 20) || typeof r['at'] !== 'string' || !(ids.has(r['at']) || names.has(r['at']))) return fail('every ref needs a "name" and an "at" that is a commit id or another ref')
      }
      return { spec: v as unknown as VisualSpec, error: null }
    }
    default: return fail(`unknown visual type "${v['type']}" (use sequence, url, flow, layers, lanes, tree or commits)`)
  }
}
