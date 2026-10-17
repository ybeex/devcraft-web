import type { Notification } from '@/lib/api/notifications'

export const NOTIFICATION_ICON: Record<Notification['type'], 'community' | 'streak' | 'projectRocket' | 'certificate' | 'xpGem'> = {
  mention: 'community',
  streak_reminder: 'streak',
  peer_review: 'projectRocket',
  certificate: 'certificate',
  system: 'xpGem',
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function str(payload: Record<string, unknown>, key: string): string | null {
  const v = payload[key]
  return typeof v === 'string' ? v : null
}

// payload is untyped on the wire (Record<string, unknown>) — every read here
// is defensive with a sensible generic fallback, since we can't guarantee
// which keys a given event actually included.
export function getMessage(n: Notification): string {
  switch (n.type) {
    case 'mention': {
      const title = str(n.payload, 'postTitle') ?? str(n.payload, 'title')
      const author = str(n.payload, 'mentionedBy')
      return author
        ? `${author} mentioned you${title ? ` in "${title}"` : ''}`
        : `You were mentioned${title ? ` in "${title}"` : ''}`
    }
    case 'streak_reminder':
      return str(n.payload, 'message') ?? "Don't lose your streak — finish a lesson today."
    case 'peer_review': {
      const title = str(n.payload, 'projectTitle')
      return title ? `Your submission for "${title}" received a peer review` : 'Your project submission received a peer review'
    }
    case 'certificate': {
      const track = str(n.payload, 'trackName')
      return track ? `You earned your ${track} certificate!` : 'You earned a new certificate!'
    }
    case 'system':
    default:
      return str(n.payload, 'message') ?? 'You have a new notification'
  }
}

export function getLink(n: Notification): string | null {
  switch (n.type) {
    case 'mention': {
      const postId = str(n.payload, 'postId')
      return postId ? `/community/${postId}` : null
    }
    case 'peer_review': {
      const projectId = str(n.payload, 'projectId')
      return projectId ? `/projects/${projectId}` : null
    }
    case 'system': {
      // System notices (such as a Pro reward) carry their own destination. Only in-app paths are followed.
      const link = str(n.payload, 'link')
      return link && link.startsWith('/') && !link.startsWith('//') ? link : null
    }
    default:
      return null
  }
}
