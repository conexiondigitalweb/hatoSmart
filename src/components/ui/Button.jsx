import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary:   'bg-brand-green text-white hover:bg-green-700 active:bg-green-800 shadow-sm',
        secondary: 'border-2 border-brand-green text-brand-green bg-transparent hover:bg-green-50',
        danger:    'bg-destructive text-destructive-foreground hover:bg-red-600',
        ghost:     'text-foreground hover:bg-muted',
        outline:   'border border-border bg-card text-foreground hover:bg-muted',
        link:      'text-brand-green underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-12 px-5 text-sm',
        sm:      'h-9 px-3 text-xs',
        lg:      'h-14 px-6 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, loading, children, disabled, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  // Radix's Slot requires exactly one React element child — `{loading &&
  // ...} {children}` is fine for a plain <button> (the `false` just
  // doesn't render) but Slot counts it as a second child and throws.
  // asChild callers pass a single element (e.g. a <Link>) and don't use
  // `loading`, so skip the spinner wrapper entirely in that case.
  const content = asChild ? children : (
    <>
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </>
  )
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </Comp>
  )
})

export default Button
export { buttonVariants }
