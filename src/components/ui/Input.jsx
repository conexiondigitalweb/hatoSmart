import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef(function Input(
  { label, error, helperText, className = '', id, required, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'flex h-12 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-shadow duration-150',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      {helperText && !error && <span className="text-xs text-muted-foreground">{helperText}</span>}
    </div>
  )
})

export default Input
