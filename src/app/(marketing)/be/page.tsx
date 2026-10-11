import type { Metadata } from 'next'
import { TrackPageTemplate, type TrackPageData } from '@/components/marketing/TrackPageTemplate'

export const metadata: Metadata = {
  title: 'Backend Engineering Track',
  description:
    'Build robust, scalable server-side systems — from Node.js fundamentals to distributed system design.',
}

const data: TrackPageData = {
  accent: 'be',
  trackIcon: 'trackBe',
  trackName: 'Backend Engineering',
  tagline: 'Build the systems that never go down.',
  description:
    'From how the web works to distributed system design — eight modules covering Node.js, databases, auth, and the infrastructure that powers production APIs.',
  techStack: ['Node.js', 'Express', 'PostgreSQL', 'REST', 'GraphQL', 'Auth', 'Docker', 'System Design'],
  modules: [
    { title: 'How the Web Works', lessonCount: 6, estimatedHours: 2 },
    { title: 'Node.js Core', lessonCount: 14, estimatedHours: 5 },
    { title: 'REST API Design', lessonCount: 16, estimatedHours: 6 },
    { title: 'SQL & PostgreSQL', lessonCount: 15, estimatedHours: 6 },
    { title: 'Authentication & Security', lessonCount: 13, estimatedHours: 5 },
    { title: 'Advanced Backend Patterns', lessonCount: 17, estimatedHours: 7, isPremium: true },
    { title: 'Docker & Containers', lessonCount: 10, estimatedHours: 4, isPremium: true },
    { title: 'System Design', lessonCount: 18, estimatedHours: 8, isPremium: true },
  ],
  audiences: [
    {
      title: 'Complete beginners',
      description: 'Start with how HTTP and DNS actually work, then build up through Node.js fundamentals — no prior backend experience needed.',
    },
    {
      title: 'Frontend developers going full-stack',
      description: 'Already comfortable with JavaScript? Skip straight to REST API design and databases — the Node.js module moves fast.',
    },
    {
      title: 'Junior backend engineers',
      description: 'Working in production already? The system design and advanced patterns modules cover what separates mid from senior.',
    },
  ],
  featuredProjectTitles: [
    'Full REST API with Auth',
    'Real-time Chat Backend',
    'Job Queue & Worker System',
  ],
}

export default function BackendTrackPage() {
  return <TrackPageTemplate data={data} />
}
