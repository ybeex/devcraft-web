import { z } from 'zod'

// Both link fields are individually optional (mirrors the backend's
// SubmitProjectBody), but the pair is refined so at least one is present —
// a submission with neither a repo nor a live link isn't reviewable.
export const ProjectSubmitSchema = z
  .object({
    repoUrl: z.string().trim().url('Enter a valid URL').max(500).optional().or(z.literal('')),
    liveUrl: z.string().trim().url('Enter a valid URL').max(500).optional().or(z.literal('')),
    notes: z.string().trim().max(2000, 'Keep it under 2000 characters').optional().or(z.literal('')),
  })
  .refine((data) => !!data.repoUrl || !!data.liveUrl, {
    message: 'Add a repo link or a live link — at least one is required',
    path: ['repoUrl'],
  })

export type ProjectSubmitValues = z.infer<typeof ProjectSubmitSchema>
