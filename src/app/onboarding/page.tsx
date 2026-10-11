import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata: Metadata = {
  title: 'Welcome to DevCraft',
  description: 'Choose your track and meet your AI tutor.',
}

export default function OnboardingPage() {
  // useSearchParams (the ?track= hint from the marketing pages) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  )
}
