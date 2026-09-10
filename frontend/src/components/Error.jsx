export function ErrorDisplay({ message, onRetry, retryLabel = 'Try Again' }) {
  return (
    <div className="card p-6 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-danger-600 dark:text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-danger-700 dark:text-danger-300 font-semibold text-lg">Error</h3>
          <p className="text-danger-600 dark:text-danger-400 mt-1 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 btn-danger"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function InlineError({ message }) {
  return (
    <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4 text-danger-600 dark:text-danger-400 text-sm">
      {message}
    </div>
  )
}