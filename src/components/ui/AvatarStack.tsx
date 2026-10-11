import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Avatar {
  name: string
  src?: string | null
}

interface AvatarStackProps {
  avatars: Avatar[]
  max?: number
  size?: number
  className?: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Overflow avatar group ("+9") — direct lift from the MAC IQ reference. */
export function AvatarStack({ avatars, max = 3, size = 32, className }: AvatarStackProps) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div className={cn('flex items-center', className)} style={{ marginLeft: -8 }}>
      {visible.map((a, i) => (
        <div
          key={i}
          className="flex items-center justify-center overflow-hidden rounded-full border-2 border-canvas bg-brand-muted text-xs font-semibold text-brand"
          style={{ width: size, height: size, marginLeft: i === 0 ? 8 : -8, zIndex: visible.length - i }}
        >
          {a.src ? (
            <Image src={a.src} alt={a.name} width={size} height={size} className="h-full w-full object-cover" />
          ) : (
            initials(a.name)
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="flex items-center justify-center rounded-full border-2 border-canvas bg-card text-xs font-semibold text-dim"
          style={{ width: size, height: size, marginLeft: -8, zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
