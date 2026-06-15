import Button from './Button'

export default function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      {icon && <div className="text-5xl">{icon}</div>}
      <div>
        <p className="font-semibold text-[#2b3240] text-lg">{title}</p>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      {action && onAction && (
        <Button onClick={onAction} className="mt-2">
          {action}
        </Button>
      )}
    </div>
  )
}
