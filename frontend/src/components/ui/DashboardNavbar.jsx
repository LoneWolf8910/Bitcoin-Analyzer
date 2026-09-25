import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, RefreshCw, Download, 
  Search, X, Menu, X as CloseIcon,
  Shield, AlertTriangle, BarChart2, GitBranch, Settings
} from 'lucide-react'
import { formatCompactBTC, truncateAddress } from '../../utils/formatters.jsx'

export function DashboardNavbar({ 
  walletAddress, 
  riskScore, 
  riskLevel, 
  backendHealth, 
  lastUpdated,
  onNewSearch,
  onExport,
  onRefresh,
  onBack,
  isRefreshing,
  isExporting,
  showMobileMenu = false,
  onToggleMenu
}) {
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-danger-600 dark:text-danger-400'
    if (score >= 60) return 'text-orange-600 dark:text-orange-400'
    if (score >= 30) return 'text-warning-600 dark:text-warning-400'
    return 'text-success-600 dark:text-success-400'
  }

  const getRiskBg = (level) => {
    const colors = {
      LOW: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800',
      MEDIUM: 'bg-warning-50 dark:bg-warning-900/30 border-warning-200 dark:border-warning-800',
      HIGH: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      CRITICAL: 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-800',
    }
    return colors[level] || 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
  }

  const getRiskBadge = (level) => {
    const badges = {
      LOW: 'badge-success',
      MEDIUM: 'badge-warning',
      HIGH: 'badge-warning',
      CRITICAL: 'badge-danger',
      UNKNOWN: 'badge-neutral',
    }
    return badges[level] || badges.UNKNOWN
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
      style={{
        background: scrolled 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container-page">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left: Back button + Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onBack && (
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 bg-surface-100/50 dark:bg-surface-800/50 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
                aria-label="Back to landing"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </motion.button>
            )}
            
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 100%)" }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="font-bold font-display text-surface-900 dark:text-surface-100 text-lg">TxGuard</span>
            </motion.div>
          </div>

          {/* Center: Wallet Info + Risk */}
          {walletAddress && (
            <div className="flex-1 flex items-center justify-center lg:justify-start gap-4 min-w-0 px-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)" }}>
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" />
                  </svg>
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="font-mono text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {truncateAddress(walletAddress, 8, 6)}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Wallet Address</p>
                </div>
              </div>

              {riskScore !== undefined && (
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${getRiskBg(riskLevel)} flex-shrink-0`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="relative flex-shrink-0">
                    <span className={`text-xl font-bold font-display ${getRiskColor(riskScore)}`}>
                      {riskScore}
                    </span>
                    <div className="absolute inset-0 rounded-xl border border-current/20 animate-spin" 
                      style={{ animationDuration: '20s', animationTimingFunction: 'linear' }} />
                  </div>
                  <div className="min-w-0">
                    <span className={`${getRiskBadge(riskLevel)} text-xs`}>
                      {riskLevel}
                    </span>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 font-medium">Priority</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Right: Actions + Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {walletAddress && (
              <>
                <motion.button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2.5 rounded-lg text-surface-600 dark:text-surface-400 bg-surface-100/50 dark:bg-surface-800/50 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 border border-surface-200/50 dark:border-surface-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh investigation"
                >
                  <motion.span
                    className="w-5 h-5"
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  </motion.span>
                </motion.button>

                <motion.button
                  onClick={onExport}
                  disabled={isExporting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2.5 rounded-lg text-surface-600 dark:text-surface-400 bg-surface-100/50 dark:bg-surface-800/50 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 border border-surface-200/50 dark:border-surface-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Export data"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                </motion.button>

                <motion.button
                  onClick={onNewSearch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2.5 rounded-lg text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/20 hover:bg-brand-100/50 dark:hover:bg-brand-900/30 border border-brand-200/50 dark:border-brand-800/50 transition-colors"
                  aria-label="New search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.button>
              </>
            )}

            {/* Backend Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium hidden sm:flex">
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'ok' ? 'bg-success-500' : 'bg-danger-500'} animate-pulse`} aria-hidden="true" />
              <span className={backendHealth?.status === 'ok' ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'}>
                {backendHealth?.status === 'ok' ? 'Backend Connected' : 'Backend Offline'}
              </span>
            </div>

            {/* Offline Mode Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-50/60 dark:bg-success-900/20 border border-success-200/50 dark:border-success-800/50 text-success-700 dark:text-success-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 shadow-lg rounded-b-2xl overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-3">
                <motion.button
                  onClick={onNewSearch}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                >
                  <Search className="w-5 h-5 text-surface-400" />
                  <span className="font-medium">New Investigation</span>
                </motion.button>
                
                <motion.button
                  onClick={onExport}
                  disabled={isExporting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-surface-400" />
                  <span className="font-medium">Export Data</span>
                </motion.button>

                <motion.button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5 text-surface-400" />
                  <span className="font-medium">Refresh</span>
                </motion.button>

                {onBack && (
                  <motion.button
                    onClick={onBack}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                  >
                    <ChevronLeft className="w-5 h-5 text-surface-400" />
                    <span className="font-medium">Back to Home</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

export default DashboardNavbar