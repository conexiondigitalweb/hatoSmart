import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Card = forwardRef(function Card({ className, onClick, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground rounded-2xl shadow-sm border-0',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
})

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col space-y-1 p-5 pb-3', className)} {...props} />
})

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} className={cn('font-semibold text-base leading-none tracking-tight', className)} {...props} />
})

const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
})

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
})

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
})

export default Card
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
