import { z } from 'zod'

// Post `type` is deliberately not part of this schema — it's driven by a
// SegmentedControl bound to local state (always one of four fixed labels,
// so there's no invalid state to validate) rather than a registered field.
export const CommunityPostSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().trim().min(20, 'Say a bit more — at least 20 characters').max(10000),
  codeSnippet: z.string().max(10000).optional().or(z.literal('')),
  language: z.string().max(30).optional().or(z.literal('')),
  tags: z.string().max(200).optional().or(z.literal('')),
})

export type CommunityPostFormValues = z.infer<typeof CommunityPostSchema>
