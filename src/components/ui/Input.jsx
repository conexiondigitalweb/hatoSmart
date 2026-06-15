export default function Input({ label, error, helperText, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#2b3240]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`min-h-[48px] px-4 py-3 rounded-xl border bg-white text-[#2b3240] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e] transition-shadow ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
      {helperText && !error && <span className="text-xs text-gray-400">{helperText}</span>}
    </div>
  )
}
