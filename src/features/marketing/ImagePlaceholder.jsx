import { Image } from 'lucide-react'
import { cn } from '../../lib/utils'

// Visual stand-in for a real photo/illustration that doesn't exist yet.
// Renders the literal {{TOKEN}} on the page itself (not just in a code
// comment) so it's unmistakable in the browser which asset goes where —
// see the placeholder map at the top of LandingPage.jsx for the full list.
export default function ImagePlaceholder({ token, hint, className, dark = false }) {
  return (
    <div
      className={cn(
        'w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center p-6',
        dark ? 'border-white/30 bg-white/5 text-white/60' : 'border-border bg-muted text-muted-foreground',
        className
      )}
    >
      <Image className="w-8 h-8 opacity-60" />
      <span className="font-mono text-xs sm:text-sm font-semibold tracking-tight">{`{{${token}}}`}</span>
      {hint && <span className="text-[11px] sm:text-xs opacity-70 max-w-[220px]">{hint}</span>}
    </div>
  )
}
