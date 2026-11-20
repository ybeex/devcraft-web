import { authFetch } from './auth-fetch'

export interface GraphCommit { sha: string; parents: string[]; subject: string; author: string; refs: string[]; time: number }
export interface LabState {
  available: boolean
  scenario: string
  lessonId: string | null
  head: { branch: string | null; sha: string | null; detached: boolean }
  commits: GraphCommit[]
  truncated: boolean
  branches: Array<{ name: string; sha: string; remote: boolean }>
  tags: string[]
  status: Array<{ code: string; path: string }>
  files: Array<{ path: string; dir: boolean }>
  operation: 'merge' | 'rebase' | 'cherry-pick' | 'revert' | 'bisect' | null
  stashCount: number
}
export interface ExecResult { stdout: string; stderr: string; code: number; edit?: string; state: LabState }

export const getGitLab = () => authFetch<LabState>('/git-lab')
export const prepareGitLesson = (lessonId: string) => authFetch<LabState>('/git-lab/prepare', { method: 'POST', body: { lessonId } })
export const execGit = (command: string) => authFetch<ExecResult>('/git-lab/exec', { method: 'POST', body: { command } })
export const resetGitLab = (scenario?: string) => authFetch<LabState>('/git-lab/reset', { method: 'POST', body: scenario ? { scenario } : {} })
export const readGitFile = (path: string) => authFetch<{ path: string; content: string }>(`/git-lab/file?path=${encodeURIComponent(path)}`)
export const writeGitFile = (path: string, content: string) => authFetch<LabState>('/git-lab/file', { method: 'PUT', body: { path, content } })
