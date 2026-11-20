'use client'

import { GitLabWorkspace } from '@/components/git/GitLabWorkspace'
import { DockerLabWorkspace } from '@/components/docker/DockerLabWorkspace'
import type { CheckResult } from '@/lib/api/lessons'

/** What a Git lesson shows instead of the code editor: the real terminal, the history graph and a Check button. */
export function GitLessonPane({ lessonId, kind = 'git', checkResult, isChecking, onCheck }: { lessonId: string; kind?: 'git' | 'docker'; checkResult: CheckResult | null; isChecking: boolean; onCheck: () => void }) {
  if (kind === 'git') {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--code-bg)]" data-testid="git-lesson-pane">
        <GitLabWorkspace lessonId={lessonId} compact checkResult={checkResult} isChecking={isChecking} onCheck={onCheck} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto p-3" data-testid="git-lesson-pane">
      <DockerLabWorkspace lessonId={lessonId} compact checkResult={checkResult} isChecking={isChecking} onCheck={onCheck} />
    </div>
  )
}
