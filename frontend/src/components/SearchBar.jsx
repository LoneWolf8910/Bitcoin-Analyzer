import { useState, useRef, useEffect, useCallback } from 'react'

export function SearchBar({ onSearch, onInvestigate, searchResults, loading, disabled = false }) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  const handleClickOutside = useCallback((event) => {
    if (inputRef.current && !inputRef.current.contains(event.target) &&
        resultsRef.current && !resultsRef.current.contains(event.target)) {
      setShowResults(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length >= 2) {
      onInvestigate(trimmed)
      setShowResults(false)
      setQuery('')
    }
  }

  const handleInputChange = (value) => {
    setQuery(value)
    if (value.length >= 2) {
      onSearch(value)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }

  const handleResultClick = (item) => {
    if (item.type === 'wallet') {
      onInvestigate(item.value)
    }
    setShowResults(false)
    setQuery('')
  }

  const hasResults = searchResults && (searchResults.wallets?.length > 0 || searchResults.transactions?.length > 0)

  return (
    <div className="relative" ref={inputRef}>
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto sm:mx-0">
        <label htmlFor="search-input" className="sr-only">Search wallet address or transaction ID</label>
        <div className={`relative transition-all duration-200 ${focused ? 'ring-2 ring-brand-500/20' : ''}`}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-surface-400 dark:text-surface-500 pointer-events-none flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-mono text-surface-400 dark:text-surface-500 hidden sm:block">Search</span>
          </div>
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter wallet address or TXID..."
            disabled={disabled || loading}
            className="input pl-12 pr-12 sm:pl-14 py-3 text-base w-full min-w-0"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded={showResults && hasResults}
            aria-describedby="search-hint"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 flex-shrink-0">
              <svg className="w-5 h-5 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">Searching...</span>
            </div>
          )}
          {!loading && query.length >= 2 && !hasResults && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-warning-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">No results</span>
            </div>
          )}
        </div>
        <p id="search-hint" className="sr-only">Type at least 2 characters to search wallets and transactions</p>
      </form>

      {showResults && hasResults && (
        <div
          ref={resultsRef}
          id="search-results"
          className="fixed left-0 right-0 mt-2 max-w-2xl mx-auto sm:mx-0 z-50 animate-slide-down"
          role="listbox"
        >
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl overflow-hidden max-h-96 overflow-y-auto min-w-0">
            {searchResults.wallets?.length > 0 && (
              <div className="border-b border-surface-200 dark:border-surface-700">
                <p className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Wallets</p>
                <ul role="list">
                  {searchResults.wallets.slice(0, 5).map((wallet) => (
                    <li key={wallet.value} role="option" tabIndex={0}>
                      <button
                        onClick={() => handleResultClick({ type: 'wallet', value: wallet.value })}
                        className="w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 flex items-center gap-3 transition-colors group min-w-0"
                      >
                        <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{wallet.value}</span>
                          <span className="text-xs text-surface-500 dark:text-surface-400 capitalize">{wallet.label || 'unknown'}</span>
                        </div>
                        <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 group-hover:text-brand-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchResults.transactions?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Transactions</p>
                <ul role="list">
                  {searchResults.transactions.slice(0, 5).map((tx) => (
                    <li key={tx.value} role="option" tabIndex={0}>
                      <button
                        onClick={() => handleResultClick({ type: 'transaction', value: tx.value })}
                        className="w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 flex items-center gap-3 transition-colors group min-w-0"
                      >
                        <div className="w-8 h-8 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-info-600 dark:text-info-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate block group-hover:text-info-600 dark:group-hover:text-info-400 transition-colors">{tx.value}</span>
                          <span className="text-xs text-surface-500 dark:text-surface-400">{tx.label}</span>
                        </div>
                        <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 group-hover:text-info-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {query.length >= 2 && searchResults && searchResults.wallets?.length === 0 && searchResults.transactions?.length === 0 && (
        <div className="fixed left-0 right-0 mt-2 max-w-2xl mx-auto sm:mx-0 z-50 animate-slide-down">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-4 text-center min-w-0">
            <p className="text-surface-500 dark:text-surface-400 text-sm break-words">No results found for <span className="font-mono text-surface-700 dark:text-surface-300">"{query}"</span></p>
          </div>
        </div>
      )}
    </div>
  )
}