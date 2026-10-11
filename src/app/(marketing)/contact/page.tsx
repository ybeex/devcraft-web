import type { Metadata } from 'next'
import { ContactContent } from '@/components/marketing/ContactContent'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Questions about DevCraft? Reach out and we\'ll get back to you within one business day.',
}

export default function ContactPage() {
  return <ContactContent />
}
