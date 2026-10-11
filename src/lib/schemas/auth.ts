import { z } from 'zod'

// Mirrors passwordSchema in the real backend's auth.schema.ts exactly —
// client-side validation should never be laxer than the server, or users
// hit a confusing late failure after already submitting.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((pw) => /[A-Z]/.test(pw), 'Add at least one uppercase letter')
  .refine((pw) => /[a-z]/.test(pw), 'Add at least one lowercase letter')
  .refine((pw) => /[0-9]/.test(pw), 'Add at least one number')

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores')

export const RegisterFormSchema = z.object({
  displayName: z.string().min(2, 'Enter your name').max(100),
  username: usernameSchema,
  email: z.string().email('Enter a valid email address').max(320),
  password: passwordSchema,
})

export const LoginFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const ForgotPasswordFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export const ResetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>
export type LoginFormValues = z.infer<typeof LoginFormSchema>
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>
