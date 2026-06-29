import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '../../lib/utils'

export function Dialog({ open, onOpenChange, children }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  )
}

export function DialogContent({ className, children }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-card p-6 shadow-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogTitle({ className, children }) {
  return (
    <RadixDialog.Title className={cn('text-base font-bold text-foreground mb-2', className)}>
      {children}
    </RadixDialog.Title>
  )
}

export function DialogDescription({ className, children }) {
  return (
    <RadixDialog.Description className={cn('text-sm text-muted-foreground leading-relaxed', className)}>
      {children}
    </RadixDialog.Description>
  )
}
