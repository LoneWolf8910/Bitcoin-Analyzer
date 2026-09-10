export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}

export function SearchEmptyState({ onSearch }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1} fill="none" opacity={0.3} />
        </svg>
      }
      title="Search for a Wallet or Transaction"
      description="Enter a Bitcoin wallet address (26-35 chars) or transaction ID (64 hex chars) to begin investigation."
      action={
        <button
          onClick={onSearch}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Start Investigation
        </button>
      }
    />
  )
}

export function DataEmptyState({ title = 'No Data Available', description }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title={title}
      description={description}
    />
  )
}