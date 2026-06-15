export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-4 ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
