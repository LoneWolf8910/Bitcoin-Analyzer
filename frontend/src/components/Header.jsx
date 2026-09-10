import { useState, useEffect } from 'react'

export function Header() {
  const [isDark, setIsDark] = useState(false)
  const [backendHealth, setBackendHealth] = useState(null)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health')
        if (res.ok) {
          const data = await res.json()
          setBackendHealth(data)
        } else {
          setBackendHealth({ status: 'error', offline: false })
        }
      } catch {
        setBackendHealth({ status: 'error', offline: false })
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDark = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('darkMode', newDark.toString())
    document.documentElement.classList.toggle('dark', newDark)
  }

  const isConnected = backendHealth?.status === 'ok'

  return (
    <header className="h-16 bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4 min-w-0">

          {/* LEFT: App mark + name + subtitle */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 bg-surface-900 dark:bg-surface-50 rounded flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <svg className="w-4.5 h-4.5 text-white dark:text-surface-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" opacity={0.4} />
              </svg>
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base font-semibold text-surface-900 dark:text-surface-100 tracking-tight truncate font-sans">
                Bitcoin Transaction Analyzer
              </h1>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 font-mono truncate max-w-[240px]">
                SIH 2026 • PS 26146
              </p>
            </div>
            <div className="sm:hidden min-w-0">
              <h1 className="text-sm font-semibold text-surface-900 dark:text-surface-100 tracking-tight truncate max-w-[140px] font-sans">
                Bitcoin Transaction Analyzer
              </h1>
            </div>
          </div>

          {/* CENTER: Navigation - only Dashboard exists as actual page */}
          <nav className="hidden md:flex items-center gap-1 min-w-0" aria-label="Main navigation">
            <a
              href="#"
              className="px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 rounded transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
              aria-current="page"
            >
              Dashboard
            </a>
          </nav>

          {/* RIGHT: Status area */}
          <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">

            {/* OFFLINE MODE badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded text-xs font-medium text-success-700 dark:text-success-300">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" aria-hidden="true" />
              <span>OFFLINE MODE</span>
            </div>

            {/* Backend connection status */}
            <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-medium min-w-0 ${isConnected
                ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300'
                : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500 animate-pulse-ring' : 'bg-danger-500'} flex-shrink-0`} aria-hidden="true" />
              <span className="truncate max-w-[100px]">
                Backend: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* NTRO affiliation */}
            <div className="hidden xl:flex flex-col items-end gap-0 text-right min-w-0">
              <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate max-w-[180px]">
                Problem Statement: National Technical Research Organisation
              </p>
              <p className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">
                SIH 2026
              </p>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-surface-600 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile: NTRO affiliation + status */}
        <div className="xl:hidden md:hidden mt-2 pt-2 border-t border-surface-200 dark:border-surface-700 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate max-w-[160px]">
              Problem Statement: National Technical Research Organisation
            </p>
            <p className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">SIH 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded text-xs font-medium text-success-700 dark:text-success-300">
              <span className="w-1 h-1 bg-success-500 rounded-full animate-pulse" aria-hidden="true" />
              <span>OFFLINE</span>
            </div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium ${isConnected
              ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300'
              : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success-500 animate-pulse-ring' : 'bg-danger-500'}`} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}