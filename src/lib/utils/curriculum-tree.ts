import type { CurriculumModule, CurriculumLesson } from '../api/curriculum'
import type { LessonStatusEntry } from '../api/progress'

export type NodeState = 'locked' | 'available' | 'completed'

export interface ModuleNodeData {
  module: CurriculumModule
  state: NodeState
  completedCount: number
  totalCount: number
}

export interface LessonNodeData {
  lesson: CurriculumLesson
  state: NodeState
}

/**
 * Computes lock/available/completed state for every module and lesson in a
 * track. IMPORTANT — this is a frontend-only motivational device, not a real
 * access-control mechanism: the backend does not enforce lesson order at
 * all (POST /lessons/:id/complete works on any valid, tier-permitted lesson
 * ID regardless of sequence). A determined learner can open any lesson URL
 * directly. "Locking" here exists purely to give the curriculum a sense of
 * progression; it is not, and should not be mistaken for, a security boundary.
 *
 * Rule: a module is locked until the previous module (by `order`) is fully
 * complete, or it's the first module. All lessons within an unlocked module
 * are freely available in any sequence — there is no per-lesson locking
 * within an already-unlocked module, since the backend has no prerequisite
 * graph to honor and arbitrary in-module ordering restrictions would only
 * add friction with no real benefit.
 */
export function computeModuleStates(
  modules: CurriculumModule[],
  lessonStatuses: LessonStatusEntry[]
): ModuleNodeData[] {
  const statusByLessonId = new Map(lessonStatuses.map((s) => [s.lessonId, s.status]))
  const sortedModules = [...modules].sort((a, b) => a.order - b.order)

  let previousModuleComplete = true // first module is always available

  return sortedModules.map((mod) => {
    const total = mod.lessons.length
    const completedCount = mod.lessons.filter((l) => statusByLessonId.get(l.id) === 'COMPLETED').length
    const isComplete = total > 0 && completedCount === total

    const state: NodeState = isComplete ? 'completed' : previousModuleComplete ? 'available' : 'locked'
    previousModuleComplete = isComplete || (previousModuleComplete && total === 0)

    return { module: mod, state, completedCount, totalCount: total }
  })
}

export function computeLessonStates(
  module: CurriculumModule,
  moduleState: NodeState,
  lessonStatuses: LessonStatusEntry[]
): LessonNodeData[] {
  const statusByLessonId = new Map(lessonStatuses.map((s) => [s.lessonId, s.status]))
  const sortedLessons = [...module.lessons].sort((a, b) => a.order - b.order)

  return sortedLessons.map((lesson) => {
    if (moduleState === 'locked') return { lesson, state: 'locked' as const }
    const status = statusByLessonId.get(lesson.id) ?? 'NOT_STARTED'
    return { lesson, state: status === 'COMPLETED' ? ('completed' as const) : ('available' as const) }
  })
}
