import type { Metadata } from 'next'
import { BlogIndexContent } from '@/components/marketing/BlogIndexContent'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Engineering notes, product decisions, and curriculum thinking from the team building DevCraft.',
}

export default function BlogIndexPage() {
  return <BlogIndexContent />
}
