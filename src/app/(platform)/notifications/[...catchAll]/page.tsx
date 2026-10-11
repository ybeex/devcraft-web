import { notFound } from 'next/navigation'

/** Scoped under /notifications — mirrors (platform)/dashboard's catch-all. */
export default function NotificationsCatchAll(): never {
  notFound()
}
