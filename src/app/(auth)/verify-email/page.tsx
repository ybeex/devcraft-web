import type { Metadata } from 'next'
import { Suspense } from 'react'
import { VerifyEmailStatus } from '@/components/marketing/auth/VerifyEmailStatus'

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Confirm your email address for your DevCraft account.',
  robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
  return (
    // useSearchParams (to read ?token=) needs a Suspense boundary for static generation.
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  )
}
