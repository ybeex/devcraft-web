import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/marketing/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your DevCraft account.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
