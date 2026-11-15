import { StorefrontWorkspace } from '@/components/playground/StorefrontWorkspace'

export const metadata = { title: 'Storefront API' }

export default function StorefrontPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Storefront API</h1>
      <p className="mt-1 text-sm text-dim">A real shop API to build against: products, search, accounts, a cart and checkout. Call it from any page you write, and make it slow or broken on purpose to practise loading and error states.</p>
      <StorefrontWorkspace />
    </div>
  )
}
