import { AlertTriangle, Container, FlaskConical } from 'lucide-react'
import type { DockerView } from '@/lib/api/docker-lab'

/** States plainly what the learner is typing into, so a simulation is never mistaken for a real engine (or the reverse). */
export function EngineNotice({ engine, engineError, onRetry }: { engine?: DockerView['engine']; engineError?: string | null; onRetry?: () => void }) {
  if (engine === 'real') {
    return (
      <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-3 py-2 text-xs text-dim" data-testid="docker-engine-notice" data-engine="real">
        <p className="flex items-center gap-2 font-semibold text-ink"><Container size={13} /> Real Docker engine <span className="font-normal text-ghost">— your own isolated engine; commands really run.</span></p>
        <p className="mt-1">Each container is limited to 256 MB of memory, half a CPU and 128 processes. Privileged mode, host networking, host paths and the Docker socket are blocked. <code>docker compose</code> is not available here yet.</p>
        {engineError && (
          <p role="alert" className="mt-2 flex items-center gap-2 text-error"><AlertTriangle size={13} /> The engine did not respond: {engineError}
            {onRetry && <button type="button" onClick={onRetry} className="ml-1 underline">Try again</button>}
          </p>
        )}
      </div>
    )
  }
  return (
    <details className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-3 py-2 text-xs text-dim" data-testid="docker-engine-notice" data-engine="emulated">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold text-ink"><FlaskConical size={13} /> Practice engine (simulated) <span className="font-normal text-ghost">— commands and output follow Docker, but no real container runs. What does that mean?</span></summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>The commands, flags, error messages and Dockerfile checks are modelled on real Docker, so what you practise transfers.</li>
        <li>Nothing is actually executed: your app code is not started, image builds are not real layers, and <code>curl</code> answers from a small model of your container.</li>
        <li>It cannot pull live images, reach the internet, or show real resource usage or timings.</li>
        <li>To see real behaviour, install Docker on your own machine and repeat the exercise there.</li>
      </ul>
    </details>
  )
}
