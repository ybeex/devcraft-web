import type { Metadata } from 'next'
import { TrackPageTemplate, type TrackPageData } from '@/components/marketing/TrackPageTemplate'

export const metadata: Metadata = {
  title: 'Frontend Engineering Track',
  description:
    'Master the craft of building exceptional user interfaces — from semantic HTML to production React applications.',
}

const data: TrackPageData = {
  accent: 'fe',
  trackIcon: 'trackFe',
  trackName: 'Frontend Engineering',
  tagline: 'Build interfaces people actually enjoy using.',
  description:
    'From semantic HTML to production-grade React and Next.js applications — eight modules that take you from fundamentals to job-ready, with real projects at every step.',
  techStack: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Testing', 'Performance'],
  modules: [
    { title: 'HTML Semantics & Accessibility', lessonCount: 9, estimatedHours: 3 },
    { title: 'CSS Fundamentals', lessonCount: 11, estimatedHours: 4 },
    { title: 'CSS Layout: Flexbox & Grid', lessonCount: 8, estimatedHours: 3 },
    { title: 'JavaScript Core', lessonCount: 18, estimatedHours: 8 },
    { title: 'TypeScript', lessonCount: 12, estimatedHours: 5 },
    { title: 'React Core', lessonCount: 14, estimatedHours: 6 },
    { title: 'React Advanced', lessonCount: 13, estimatedHours: 6, isPremium: true },
    { title: 'Next.js App Router', lessonCount: 15, estimatedHours: 7, isPremium: true },
  ],
  audiences: [
    {
      title: 'Complete beginners',
      description: 'Never written a line of code? Start at HTML semantics and build up — every concept is explained from first principles.',
    },
    {
      title: 'Self-taught developers',
      description: 'Know enough to be dangerous but have gaps? The interview prep and architecture modules fill in what tutorials skip.',
    },
    {
      title: 'Junior engineers',
      description: 'Already working in FE? The advanced React and performance modules take you from "it works" to "it scales."',
    },
  ],
  featuredProjectTitles: [
    'Full SaaS Dashboard UI',
    'Real-time Collaboration Tool',
    'E-commerce Storefront',
  ],
}

export default function FrontendTrackPage() {
  return <TrackPageTemplate data={data} />
}
