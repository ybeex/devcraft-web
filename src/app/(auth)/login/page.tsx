import type { Metadata } from 'next'
import { LoginForm } from '@/components/marketing/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to continue your DevCraft learning track.',
}

export default function LoginPage() {
  return <LoginForm />
}
