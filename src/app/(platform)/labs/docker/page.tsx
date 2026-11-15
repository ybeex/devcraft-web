import { DockerLabWorkspace } from '@/components/docker/DockerLabWorkspace'

export const metadata = { title: 'Docker lab' }

export default function DockerLabPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col px-5 py-6 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Docker lab</h1>
      <p className="mb-4 mt-1 text-sm text-dim">A terminal that accepts real Docker and Compose commands against your own engine. Build images, run containers, break things and read the errors; Reset puts the exercise back.</p>
      <DockerLabWorkspace />
    </div>
  )
}
