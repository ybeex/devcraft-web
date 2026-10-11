import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/marketing/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set a new password',
  description: 'Choose a new password for your DevCraft account.',
}

export default function ResetPasswordPage() {
  return (
    // useSearchParams (to read ?token=) requires a Suspense boundary in the
    // App Router — without it, `next build` fails static generation for this page.
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
