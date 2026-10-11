import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterForm } from '@/components/marketing/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Start learning Frontend or Backend Engineering — free, forever.',
}

export default function RegisterPage() {
  // useSearchParams (?track=) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
