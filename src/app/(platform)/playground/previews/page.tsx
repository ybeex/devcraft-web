import { PreviewsWorkspace } from '@/components/playground/PreviewsWorkspace'

export const metadata = { title: 'Hosted previews' }

export default function PreviewsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Hosted previews</h1>
      <p className="mt-1 text-sm text-dim">Share what you built. Each page gets its own link on a separate domain, and talks to the Storefront API like it did in your lesson.</p>
      <PreviewsWorkspace />
    </div>
  )
}
