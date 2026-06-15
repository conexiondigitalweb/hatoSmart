const statusColors = {
  active: 'bg-green-100 text-green-700',
  dry: 'bg-yellow-100 text-yellow-700',
  pregnant: 'bg-blue-100 text-blue-700',
  in_heat: 'bg-pink-100 text-pink-700',
  sick: 'bg-red-100 text-red-700',
  sold: 'bg-gray-100 text-gray-500',
  dead: 'bg-gray-200 text-gray-500',
}

export default function Badge({ status, label, className = '' }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}
