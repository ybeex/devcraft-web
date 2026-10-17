import type { CurriculumTrack, CurriculumModule, CurriculumLesson } from '../api/curriculum'
import type { LessonStatusEntry } from '../api/progress'

export interface NextLessonResult {
  module: CurriculumModule
  lesson: CurriculumLesson
}

/**
 * Finds the learner's next lesson for the dashboard's "Continue where you
 * left off" card, using exact per-lesson status from
 * `GET /progress/tracks/:slug/lessons` (see devcraft-bulk-lesson-status-module).
 *
 * This replaces an earlier heuristic that inferred "next lesson" from
 * module-level completion *counts* by assuming strict in-order completion —
 * that assumption broke the moment a learner skipped around. This version
 * has no such assumption: it finds the first entry in the real per-lesson
 * status list that isn't COMPLETED, in track-wide `order` sequence, then
 * looks up that lesson's full display info (title, estimatedMins, etc.)
 * from the curriculum tree.
 */
export function findNextLesson(
  curriculum: CurriculumTrack,
  lessonStatuses: LessonStatusEntry[]
): NextLessonResult | null {
  const sorted = [...lessonStatuses].sort((a, b) => a.order - b.order)
  const next = sorted.find((entry) => entry.status !== 'COMPLETED')
  if (!next) return null // every lesson in the track is complete

  for (const mod of curriculum.modules) {
    if (mod.id !== next.moduleId) continue
    const lesson = mod.lessons.find((l) => l.id === next.lessonId)
    if (lesson) return { module: mod, lesson }
  }

  return null // status entry referenced a lesson no longer in the published curriculum
}

/**
 * The lesson that follows `slug` in curriculum order (modules by `order`,
 * then lessons by `order`), crossing module boundaries. Returns null for the
 * last lesson of the track or an unknown slug. Used by the "Next lesson"
 * button shown once the current lesson is complete.
 */
export function lessonAfter(curriculum: CurriculumTrack, slug: string): NextLessonResult | null {
  const flat: NextLessonResult[] = [...curriculum.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => [...module.lessons].sort((a, b) => a.order - b.order).map((lesson) => ({ module, lesson })))
  const i = flat.findIndex((e) => e.lesson.slug === slug)
  return i >= 0 && i < flat.length - 1 ? flat[i + 1] : null
}
