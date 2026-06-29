import { cn } from '../../lib/utils'
import Button from './Button'

const ILLUSTRATIONS = {
  animals: (
    <svg viewBox="0 0 120 100" className="w-24 h-24" fill="none">
      <ellipse cx="60" cy="80" rx="40" ry="8" fill="#e5e7eb" />
      <circle cx="60" cy="42" r="22" fill="#d1fae5" />
      <circle cx="60" cy="42" r="16" fill="#6ee7b7" />
      <path d="M52 36 Q60 28 68 36" stroke="#065f46" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="55" cy="40" r="2" fill="#065f46"/>
      <circle cx="65" cy="40" r="2" fill="#065f46"/>
      <path d="M56 46 Q60 50 64 46" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <rect x="48" y="60" width="8" height="14" rx="4" fill="#6ee7b7"/>
      <rect x="64" y="60" width="8" height="14" rx="4" fill="#6ee7b7"/>
    </svg>
  ),
  milk: (
    <svg viewBox="0 0 120 100" className="w-24 h-24" fill="none">
      <ellipse cx="60" cy="82" rx="38" ry="7" fill="#e5e7eb"/>
      <rect x="38" y="30" width="44" height="54" rx="12" fill="#d1fae5"/>
      <path d="M38 42 Q60 36 82 42" stroke="#6ee7b7" strokeWidth="2" fill="none"/>
      <rect x="44" y="18" width="32" height="16" rx="6" fill="#6ee7b7"/>
      <circle cx="60" cy="58" r="10" fill="#ffffff" opacity="0.6"/>
    </svg>
  ),
  alerts: (
    <svg viewBox="0 0 120 100" className="w-24 h-24" fill="none">
      <ellipse cx="60" cy="84" rx="38" ry="7" fill="#e5e7eb"/>
      <path d="M60 20 L80 62 H40 Z" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="57" y="45" width="6" height="12" rx="3" fill="#065f46"/>
      <circle cx="60" cy="62" r="3" fill="#065f46"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 120 100" className="w-24 h-24" fill="none">
      <ellipse cx="60" cy="84" rx="38" ry="7" fill="#e5e7eb"/>
      <circle cx="54" cy="44" r="22" stroke="#d1fae5" strokeWidth="8" fill="none"/>
      <circle cx="54" cy="44" r="14" fill="#d1fae5"/>
      <path d="M70 60 L84 74" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  done: (
    <svg viewBox="0 0 120 100" className="w-24 h-24" fill="none">
      <ellipse cx="60" cy="84" rx="38" ry="7" fill="#e5e7eb"/>
      <circle cx="60" cy="44" r="28" fill="#d1fae5"/>
      <path d="M46 44 L56 54 L74 36" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  onAction,
  actionLabel,
  className,
}) {
  const label = action ?? actionLabel
  const svgIllustration = illustration ? ILLUSTRATIONS[illustration] : null

  return (
    <div className={cn('flex flex-col items-center gap-4 py-10 text-center px-4', className)}>
      {svgIllustration
        ? svgIllustration
        : icon && <span className="text-5xl">{icon}</span>}
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-base">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {label && onAction && (
        <Button onClick={onAction} className="mt-1">
          {label}
        </Button>
      )}
    </div>
  )
}
