export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <svg
        className={`${sizes[size]} text-brand-500 animate-spin`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card p-8 text-center min-w-[280px] animate-scale-in">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-surface-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-100 rounded-lg p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-surface-200 rounded w-1/4 mb-4" />
      <div className="h-10 bg-surface-200 rounded w-1/2" />
    </div>
  )
}