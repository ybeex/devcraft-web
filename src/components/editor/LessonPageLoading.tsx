import { Skeleton } from '@/components/ui/Skeleton'

export function LessonPageLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <header className="flex h-[42px] shrink-0 items-center gap-3 border-b border-rim-subtle bg-card px-4 py-2.5">
        <Skeleton className="h-5 w-5 shrink-0 rounded" />
        <Skeleton className="h-4 min-w-0 flex-1 max-w-56" />
        <Skeleton className="hidden h-7 w-24 rounded-full sm:block" />
        <Skeleton className="hidden h-7 w-32 rounded-full md:block" />
      </header>
      <div className="flex shrink-0 border-b border-rim-subtle lg:hidden">
        <Skeleton className="h-9 flex-1 rounded-none" />
        <Skeleton className="h-9 flex-1 rounded-none" />
      </div>
      <div className="min-h-0 flex-1">
        <div className="hidden h-full min-h-0 lg:grid lg:grid-cols-[minmax(0,40fr)_8px_minmax(0,60fr)]">
          <div className="min-h-0 overflow-hidden border-r border-rim-subtle p-5">
            <Skeleton className="mb-5 h-5 w-2/3" />
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-3 h-4 w-11/12" />
            <Skeleton className="mb-3 h-4 w-4/5" />
            <Skeleton className="mt-8 h-28 w-full rounded-[var(--radius-lg)]" />
          </div>
          <div className="bg-raised" />
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 p-4">
              <Skeleton className="h-full min-h-40 w-full rounded-[var(--radius-md)]" />
            </div>
            <div className="h-2 shrink-0 border-y border-rim-subtle bg-raised" />
            <div className="h-[42%] min-h-32 shrink-0 border-t border-rim-subtle bg-card p-4">
              <Skeleton className="mb-4 h-4 w-24" />
              <Skeleton className="h-[calc(100%-2rem)] w-full rounded-[var(--radius-md)]" />
            </div>
          </div>
        </div>
        <div className="h-full p-4 lg:hidden">
          <Skeleton className="h-full w-full rounded-[var(--radius-md)]" />
        </div>
      </div>
    </div>
  )
}
