import type { ReactNode } from 'react'

interface ComingSoonPanelProps {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
}

/** Used for the admin sub-sections whose backend is ready but frontend isn't built yet — keeps the nav honest instead of 404-ing. */
export function ComingSoonPanel({ icon, title, description, children }: ComingSoonPanelProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-20 text-center sm:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-raised text-brand">{icon}</div>
      <div>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-dim">{description}</p>
      </div>
      {children}
    </div>
  )
}
