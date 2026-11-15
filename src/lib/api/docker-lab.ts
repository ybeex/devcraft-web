import { authFetch } from './auth-fetch'

export interface DockerView {
  available: boolean
  /** 'emulated' = a teaching model of Docker; 'real' = a real Docker engine. Older servers omit it (emulated). */
  engine?: 'emulated' | 'real'
  engineError?: string | null
  scenario: string
  lessonId: string | null
  files: string[]
  images: Array<{ id: string; tags: string[]; size: number; created: string; layers: number }>
  containers: Array<{ id: string; name: string; image: string; status: string; state: 'created' | 'running' | 'exited' | 'restarting' | 'paused'; ports: string; health: 'starting' | 'healthy' | 'unhealthy' | null; networks: string[]; restarts: number; ip: string | null }>
  networks: Array<{ name: string; containers: string[]; builtin: boolean }>
  volumes: Array<{ name: string; usedBy: string[] }>
  lastBuild: { tag: string | null; seconds: number; ok: boolean; steps: Array<{ n: string; text: string; cached: boolean }>; error: string | null } | null
}
export interface DockerExecResult { stdout: string; stderr: string; code: number; edit?: string; state: DockerView }

export const getDockerLab = () => authFetch<DockerView>('/docker-lab')
export const prepareDockerLesson = (lessonId: string) => authFetch<DockerView>('/docker-lab/prepare', { method: 'POST', body: { lessonId } })
export const execDocker = (command: string) => authFetch<DockerExecResult>('/docker-lab/exec', { method: 'POST', body: { command } })
export const resetDockerLab = (scenario?: string) => authFetch<DockerView>('/docker-lab/reset', { method: 'POST', body: scenario ? { scenario } : {} })
export const readDockerFile = (path: string) => authFetch<{ path: string; content: string }>(`/docker-lab/file?path=${encodeURIComponent(path)}`)
export const writeDockerFile = (path: string, content: string) => authFetch<DockerView>('/docker-lab/file', { method: 'PUT', body: { path, content } })
