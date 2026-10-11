'use client'

import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  /** Only days with count > 0 are present — any date not in here is treated as zero. */
  activity: Array<{ date: string; count: number }>
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `date` may arrive as a bare "YYYY-MM-DD" or a full ISO timestamp (Postgres DATE via postgres.js with no custom type parser serializes as the latter) — this tolerates either. */
function dayKey(raw: string): string {
  return raw.split('T')[0]!
}

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const LEVEL_CLASS: Record<number, string> = {
  0: 'bg-raised',
  1: 'bg-brand/25',
  2: 'bg-brand/50',
  3: 'bg-brand/75',
  4: 'bg-brand',
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const countByDay = new Map(activity.map((a) => [dayKey(a.date), a.count]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay()) // roll back to the preceding Sunday, so weeks align to calendar columns

  const weeks: { key: string; count: number; label: string }[][] = []
  const monthMarkers: { weekIndex: number; label: string }[] = []
  const cursor = new Date(start)
  let weekIndex = 0
  let lastMonth = -1

  while (cursor <= today) {
    const week: { key: string; count: number; label: string }[] = []
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10)
      const count = cursor > today ? 0 : (countByDay.get(key) ?? 0)
      if (cursor.getMonth() !== lastMonth && cursor.getDate() <= 7) {
        monthMarkers.push({ weekIndex, label: MONTH_LABELS[cursor.getMonth()]! })
        lastMonth = cursor.getMonth()
      }
      week.push({
        key,
        count,
        label: `${count} ${count === 1 ? 'activity' : 'activities'} on ${cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    weekIndex += 1
  }

  const totalActivities = activity.reduce((sum, a) => sum + a.count, 0)

  if (totalActivities === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 text-center">
        <p className="text-sm text-ghost">No activity in the last year yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <p className="mb-3 text-xs font-semibold text-dim">{totalActivities.toLocaleString()} activities in the last year</p>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px] pl-0 text-[10px] text-ghost">
            {weeks.map((_, i) => {
              const marker = monthMarkers.find((m) => m.weekIndex === i)
              return (
                <span key={i} className="w-[11px] shrink-0">
                  {marker?.label ?? ''}
                </span>
              )
            })}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.key}
                    title={day.label}
                    className={cn('h-[11px] w-[11px] shrink-0 rounded-[2px]', LEVEL_CLASS[levelFor(day.count)])}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ghost">
        Less
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={cn('h-[11px] w-[11px] rounded-[2px]', LEVEL_CLASS[level])} />
        ))}
        More
      </div>
    </div>
  )
}
