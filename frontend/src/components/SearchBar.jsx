import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div
      className="relative"
      ref={inputRef}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl mx-auto sm:mx-0"
        whileFocusWithin={{ 
          scale: 1.005,
          transition: { duration: 0.2 }
        }}
      >
        <label htmlFor="search-input" className="sr-only">Search wallet address or transaction ID</label>
        <motion.div
          className="relative"
          animate={{
            boxShadow: focused
              ? '0 0 0 1px rgba(6,182,212,0.4), 0 8px 32px rgba(6,182,212,0.15), 0 0 40px rgba(6,182,212,0.1)'
              : '0 0 0 1px rgba(148,163,184,0.1), 0 4px 24px rgba(15,23,42,0.04)',
            borderColor: focused ? 'rgba(6,182,212,0.4)' : 'rgba(148,163,184,0.15)',
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-surface-400 dark:text-surface-500 pointer-events-none flex-shrink-0">
            <motion.svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              animate={{ rotate: focused ? [0, 5, -5, 0] : 0 }}
              transition={{ duration: 1.5, repeat: focused ? Infinity : 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </motion.svg>
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
            className="relative w-full min-w-0 pl-12 pr-12 py-4 text-base bg-transparent placeholder:text-surface-400 dark:placeholder:text-surface-500 text-surface-900 dark:text-surface-100 focus:outline-none"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded={showResults && hasResults}
            aria-describedby="search-hint"
            data-search-input="true"
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
            background: focused 
              ? 'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(168,85,247,0.03) 50%, rgba(6,182,212,0.05) 100%)'
              : 'transparent'
          }} />

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.svg
                  className="w-5 h-5 text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">Searching...</span>
              </motion.div>
            )}
            {!loading && query.length >= 2 && !hasResults && (
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-warning-500 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">No results</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            animate={{ scale: focused ? 1 : 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 text-brand-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.div>
        </motion.div>
        <p id="search-hint" className="sr-only">Type at least 2 characters to search wallets and transactions</p>
      </motion.form>

      <AnimatePresence>
        {showResults && hasResults && (
          <motion.div
            ref={resultsRef}
            id="search-results"
            className="fixed left-0 right-0 mt-3 max-w-2xl mx-auto sm:mx-0 z-50"
            role="listbox"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="bg-surface-100/80 dark:bg-surface-900/80 backdrop-blur-2xl border border-surface-200/50 dark:border-surface-700/50 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] overflow-hidden max-h-96 overflow-y-auto min-w-0"
              style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)' }}
            >
              {searchResults.wallets?.length > 0 && (
                <motion.div
                  className="border-b border-surface-200/50 dark:border-surface-700/50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <p className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Wallets</p>
                  <ul role="list">
                    {searchResults.wallets.slice(0, 5).map((wallet, idx) => (
                      <motion.li
                        key={wallet.value}
                        role="option"
                        tabIndex={0}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                        whileHover={{ x: 4 }}
                      >
                        <button
                          onClick={() => handleResultClick({ type: 'wallet', value: wallet.value })}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 group min-w-0 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}
                        >
                          <motion.div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(14,165,233,0.1) 100%)' }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{wallet.value}</span>
                            <span className="text-xs text-surface-500 dark:text-surface-400 capitalize">{wallet.label || 'unknown'}</span>
                          </div>
                          <motion.svg
                            className="w-4 h-4 text-surface-400 dark:text-surface-500 group-hover:text-brand-500 transition-colors flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            whileHover={{ x: 4 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </motion.svg>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {searchResults.transactions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <p className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Transactions</p>
                  <ul role="list">
                    {searchResults.transactions.slice(0, 5).map((tx, idx) => (
                      <motion.li
                        key={tx.value}
                        role="option"
                        tabIndex={0}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                        whileHover={{ x: 4 }}
                      >
                        <button
                          onClick={() => handleResultClick({ type: 'transaction', value: tx.value })}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 group min-w-0 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}
                        >
                          <motion.div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(59,130,246,0.1) 100%)' }}
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="w-4 h-4 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate block group-hover:text-info-600 dark:group-hover:text-info-400 transition-colors">{tx.value}</span>
                            <span className="text-xs text-surface-500 dark:text-surface-400">{tx.label}</span>
                          </div>
                          <motion.svg
                            className="w-4 h-4 text-surface-400 dark:text-surface-500 group-hover:text-info-500 transition-colors flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            whileHover={{ x: 4 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </motion.svg>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {query.length >= 2 && searchResults && searchResults.wallets?.length === 0 && searchResults.transactions?.length === 0 && (
          <motion.div
            className="fixed left-0 right-0 mt-3 max-w-2xl mx-auto sm:mx-0 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="bg-surface-100/80 dark:bg-surface-900/80 backdrop-blur-2xl border border-surface-200/50 dark:border-surface-700/50 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] p-4 text-center min-w-0"
            >
              <motion.p
                className="text-surface-500 dark:text-surface-400 text-sm break-words"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                No results found for <span className="font-mono text-surface-700 dark:text-surface-300">"{query}"</span>
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}