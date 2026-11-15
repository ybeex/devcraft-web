import { GitLabWorkspace } from '@/components/git/GitLabWorkspace'

export const metadata = { title: 'Git lab' }

export default function GitLabPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col px-5 py-6 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Git lab</h1>
      <p className="mb-4 mt-1 text-sm text-dim">A real repository in a real terminal, with a live picture of its history. Branch, merge, rebase, break things and fix them; Reset puts the exercise back.</p>
      <GitLabWorkspace />
    </div>
  )
}
