import type { Metadata } from 'next'
import { ChangelogContent } from '@/components/marketing/ChangelogContent'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'What shipped recently on DevCraft.',
}

export default function ChangelogPage() {
  return <ChangelogContent />
}
