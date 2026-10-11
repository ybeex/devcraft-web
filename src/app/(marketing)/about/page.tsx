import type { Metadata } from 'next'
import { AboutContent } from '@/components/marketing/AboutContent'

export const metadata: Metadata = {
  title: 'About',
  description: 'DevCraft is built on one idea: the product teaching the craft should be held to the same standard as the craft itself.',
}

export default function AboutPage() {
  return <AboutContent />
}
