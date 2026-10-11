import { create } from 'zustand'

/** Whether the "verify your email to do this" dialog is showing. Opened by the API client on EMAIL_NOT_VERIFIED. */
interface VerifyPromptState {
  open: boolean
  show: () => void
  hide: () => void
}

export const useVerifyPromptStore = create<VerifyPromptState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))
