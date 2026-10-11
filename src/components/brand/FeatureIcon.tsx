import Image from 'next/image'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  streak: '/brand/icons/icon-streak.svg',
  xpGem: '/brand/icons/icon-xp-gem.svg',
  certificate: '/brand/icons/icon-certificate.svg',
  aiTutor: '/brand/icons/icon-ai-tutor.svg',
  trackFe: '/brand/icons/icon-track-fe.svg',
  trackBe: '/brand/icons/icon-track-be.svg',
  projectRocket: '/brand/icons/icon-project-rocket.svg',
  leaderboardTrophy: '/brand/icons/icon-leaderboard-trophy.svg',
  community: '/brand/icons/icon-community.svg',
  codeWindow: '/brand/icons/icon-code-window.svg',
} as const

export type FeatureIconName = keyof typeof ICON_MAP

interface FeatureIconProps {
  name: FeatureIconName
  size?: number
  /** Dim + desaturate for "not yet achieved" empty states (Design Philosophy §13) */
  achieved?: boolean
  className?: string
}

/**
 * Renders one of the 10 custom 3D feature icons. Use this — never a raw <img>
 * or a Lucide icon — for anything representing a feature identity (streaks, XP,
 * certificates, AI tutor, track badges, projects, leaderboard, community, code).
 * Lucide remains fine for low-emphasis UI chrome (chevrons, search, settings).
 */
export function FeatureIcon({ name, size = 48, achieved = true, className }: FeatureIconProps) {
  return (
    <Image
      src={ICON_MAP[name]}
      alt=""
      width={size}
      height={size}
      className={cn(!achieved && 'opacity-40 grayscale-[0.3]', className)}
    />
  )
}
