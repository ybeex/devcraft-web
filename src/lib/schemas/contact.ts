import { z } from 'zod'

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address').max(320),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(5000),
})

export type ContactFormValues = z.infer<typeof ContactFormSchema>
