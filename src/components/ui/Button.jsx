const variants = {
  primary: 'bg-[#3dbf5e] text-white hover:bg-green-600 active:bg-green-700',
  secondary: 'bg-[#2b3240] text-white hover:bg-gray-700 active:bg-gray-800',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  ghost: 'bg-transparent text-[#2b3240] hover:bg-gray-100 active:bg-gray-200',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      className={`min-h-[48px] px-4 py-3 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
