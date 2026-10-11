import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  // btn-3d (defined in globals.css) supplies the gradient + thickness-shadow + active-press
  primary: 'btn-3d text-white',
  ghost: 'bg-transparent text-ink hover:bg-card',
  outline: 'bg-card border border-rim text-ink shadow-elev-sm hover:shadow-elev-md',
  danger: 'bg-error text-white shadow-elev-sm hover:opacity-90',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-[var(--radius-sm)]',
  md: 'px-6 py-3 text-sm rounded-[var(--radius-md)]',
  lg: 'px-8 py-4 text-base rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
