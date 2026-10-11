import { cn } from '@/lib/utils'

/**
 * No spinners (Design Philosophy §12). Every skeleton must match the exact
 * geometry of the content it replaces, including a placeholder for the
 * IconChip shape where one will appear once loaded.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <Skeleton className="h-8 w-32 rounded-full" />
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-3 h-5 w-20 rounded-full" />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-rim-subtle px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-4 flex-1 max-w-[140px]" />
      <Skeleton className="h-4 flex-1 max-w-[100px]" />
      <Skeleton className="h-4 flex-1 max-w-[80px]" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  )
}

export function SkeletonLessonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5">
      <Skeleton className="h-12 w-12 rounded-[var(--radius-md)]" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  )
}
