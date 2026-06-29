import { cn } from '../../lib/utils'

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-muted', className)}
      {...props}
    />
  )
}
