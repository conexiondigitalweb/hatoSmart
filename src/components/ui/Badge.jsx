import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-green-100 text-green-800',
        secondary:   'bg-muted text-muted-foreground',
        destructive: 'bg-red-100 text-red-800',
        outline:     'border border-border text-foreground bg-transparent',
        // Repro status
        active:      'bg-green-100 text-green-800',
        pregnant:    'bg-purple-100 text-purple-800',
        served:      'bg-blue-100 text-blue-800',
        dry:         'bg-amber-100 text-amber-800',
        fresh:       'bg-sky-100 text-sky-800',
        // Alert urgency
        urgent:      'bg-red-100 text-red-700 font-semibold',
        warning:     'bg-amber-100 text-amber-700 font-semibold',
        info:        'bg-blue-100 text-blue-700',
        // Animal status
        sold:        'bg-gray-100 text-gray-500',
        dead:        'bg-gray-200 text-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export default function Badge({ variant, label, children, className, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {label ?? children}
    </span>
  )
}

export { badgeVariants }
