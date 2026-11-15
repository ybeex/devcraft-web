import type { ErrorHelp, Prerequisite, RunResult, CheckResult } from '@/lib/api/lessons'

/** Stage describes the independence expected of the learner, not how hard the topic is. */
export const STAGE_NAMES: Record<number, string> = {
  1: 'Foundations', 2: 'Applied fundamentals', 3: 'Independent implementation', 4: 'Production engineering', 5: 'Advanced engineering', 6: 'Senior judgment',
}
export const stageLabel = (stage: number | undefined): string | null => (stage && STAGE_NAMES[stage] ? `Stage ${stage} · ${STAGE_NAMES[stage]}` : null)

export const KIND_LABELS: Record<string, string> = {
  lesson: 'Lesson', challenge: 'Challenge', debug: 'Debugging', project: 'Project', review: 'Code review', design: 'Design', incident: 'Incident',
}
export const kindLabel = (kind: string | undefined): string => KIND_LABELS[kind ?? 'lesson'] ?? 'Lesson'

/** The messages a learner is currently looking at: a run's error output and the reasons checks failed. */
export function failureTexts(run: RunResult | null, check: CheckResult | null): string[] {
  const out: string[] = []
  if (run?.stderr) out.push(run.stderr)
  for (const r of check?.results ?? []) if (!r.passed && r.reason) out.push(r.reason)
  return out
}

/** Explanations whose pattern matches any current message. A bad pattern in content is ignored rather than breaking the page. */
export function matchErrorHelp(help: ErrorHelp[] | undefined, texts: string[], limit = 2): ErrorHelp[] {
  if (!help?.length || !texts.length) return []
  const found: ErrorHelp[] = []
  for (const h of help) {
    let re: RegExp
    try { re = new RegExp(h.match, 'i') } catch { continue }
    if (texts.some((t) => re.test(t)) && !found.includes(h)) found.push(h)
    if (found.length >= limit) break
  }
  return found
}

/** Required lessons the learner has not completed yet. Shown as guidance; nothing is ever blocked. */
export const unmetPrerequisites = (p: Prerequisite[] | undefined): Prerequisite[] => (p ?? []).filter((x) => x.required && !x.completed)

export function resetTime(resetsAt: string, now: Date = new Date()): string {
  const ms = new Date(resetsAt).getTime() - now.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return 'soon'
  const hours = Math.floor(ms / 3_600_000), minutes = Math.floor((ms % 3_600_000) / 60_000)
  return hours > 0 ? `in ${hours} h ${minutes} min` : `in ${Math.max(1, minutes)} min`
}
