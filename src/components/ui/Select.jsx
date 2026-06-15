export default function Select({ label, error, helperText, options = [], className = '', id, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#2b3240]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`min-h-[48px] px-4 py-3 rounded-xl border bg-white text-[#2b3240] text-sm focus:outline-none focus:ring-2 focus:ring-[#3dbf5e] transition-shadow appearance-none ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {helperText && !error && <span className="text-xs text-gray-400">{helperText}</span>}
    </div>
  )
}
