'use client'

import { useState } from 'react'
import { getConflictIdFromError } from '@/lib/api/admin'

interface UseContentSaveResult {
  isSaving: boolean
  error: string | null
  /** Set when the save 409'd with CONTENT_CONFLICT — the caller renders a link to /admin/conflicts?id=<this>, rather than being force-navigated away from a form they were mid-editing. */
  conflictId: string | null
  save: <T>(fn: () => Promise<T>, onSuccess: (result: T) => void) => Promise<void>
}

/** Shared save/error/conflict handling for the track/module/lesson/question edit forms — see admin.ts's getConflictIdFromError for why CONTENT_CONFLICT gets its own branch instead of the generic error message. */
export function useContentSave(): UseContentSaveResult {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictId, setConflictId] = useState<string | null>(null)

  async function save<T>(fn: () => Promise<T>, onSuccess: (result: T) => void) {
    setIsSaving(true)
    setError(null)
    setConflictId(null)
    try {
      const result = await fn()
      onSuccess(result)
    } catch (err) {
      const cid = getConflictIdFromError(err)
      if (cid) {
        setConflictId(cid)
      } else {
        setError('Something went wrong saving this — try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, error, conflictId, save }
}
