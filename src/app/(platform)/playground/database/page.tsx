import { DatabaseWorkspace } from '@/components/playground/DatabaseWorkspace'
import { DatabasePlaygroundAccess } from '@/components/playground/DatabasePlaygroundAccess'

export const metadata = { title: 'Practice database' }

export default function DatabasePage() {
  return (
    <DatabasePlaygroundAccess>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Practice database</h1>
        <p className="mt-1 text-sm text-dim">A private PostgreSQL copy of two datasets: an online shop (10,000 orders) and a help desk (3,000 tickets with JSON and searchable text). Query it, change it, break it; Reset puts it back.</p>
        <DatabaseWorkspace />
      </div>
    </DatabasePlaygroundAccess>
  )
}
