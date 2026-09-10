import { useState, useEffect } from 'react'

export function Header() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) document.documentElement.classList.add('dark')
  }, [])

  const toggleDark = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('darkMode', newDark.toString())
    document.documentElement.classList.toggle('dark', newDark)
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-surface-200/50 dark:border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-600 via-purple-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" opacity={0.3} />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-white dark:border-surface-950 animate-pulse-ring" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight font-display">Bitcoin Transaction Analyzer</h1>
              <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">SIH 2026 • PS 26146</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-full">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-success-700 dark:text-success-300 text-xs font-medium">OFFLINE MODE</span>
            </div>

            <button
              onClick={toggleDark}
              className="btn-ghost p-2 rounded-lg"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="hidden lg:block text-right">
              <p className="text-xs text-surface-500 dark:text-surface-400">Backend API</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-mono font-medium">localhost:8000</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}