import { useState, useEffect, useRef } from 'react'
import { Copy, Download, RefreshCw } from 'lucide-react'
import { formatCompactBTC, truncateAddress, getRiskLevelBadge, getRiskLevelColor, getRiskLevelBg } from '../../utils/formatters.jsx'

export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)
    const trigger = triggerRef.current
    trigger?.addEventListener('mouseenter', handleMouseEnter)
    trigger?.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      trigger?.removeEventListener('mouseenter', handleMouseEnter)
      trigger?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  if (!isVisible) return <span ref={triggerRef}>{children}</span>

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <>
      <span ref={triggerRef}>{children}</span>
      <AnimatePresence>
        <motion.div
          ref={tooltipRef}
          className={`absolute ${positions[position]} z-50 px-3 py-2 text-xs font-medium text-white bg-surface-900 dark:bg-surface-100 rounded-lg shadow-lg whitespace-nowrap border border-surface-200 dark:border-surface-700`}
          initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export function CopyToClipboard({ text, children, label = 'Copy', showTooltip = true }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const buttonContent = (
    <button
      onClick={handleClick}
      className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/50"
      aria-label={copied ? 'Copied!' : label}
    >
      <Copy className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{copied ? 'Copied!' : label}</span>
      {copied && (
        <span
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-brand-500 text-white px-2 py-1 rounded whitespace-nowrap"
        >
          Copied!
        </span>
      )}
    </button>
  )

  if (showTooltip) {
    return <Tooltip content="Copy wallet address to clipboard" position="top">{buttonContent}</Tooltip>
  }
  return buttonContent
}

export function WalletHeader({ wallet, risk, graphStats, lastUpdated }) {
  const riskScore = risk?.risk_score ?? 0
  const riskLevel = risk?.risk_level || 'UNKNOWN'
  const riskColor = getRiskLevelColor(riskScore)
  const riskBg = getRiskLevelBg(riskLevel)
  const netFlow = wallet.net_flow ?? 0

  const getScoreGlow = (score) => {
    if (score >= 80) return 'rgba(239, 68, 68, 0.3)'
    if (score >= 60) return 'rgba(249, 115, 22, 0.3)'
    if (score >= 30) return 'rgba(245, 158, 11, 0.3)'
    return 'rgba(34, 197, 94, 0.3)'
  }

  return (
    <div className="card-elevated p-5 min-w-0" style={{
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
    }}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)" }}>
            <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold font-display text-surface-900 dark:text-surface-100 truncate select-all">
              {wallet.wallet_address}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm">
              <span className="px-2.5 py-1 rounded-lg font-mono text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                {wallet.transaction_count.toLocaleString()} txs
              </span>
              <span className="px-2.5 py-1 rounded-lg font-mono text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                +{formatCompactBTC(wallet.total_received)}
              </span>
              <span className="px-2.5 py-1 rounded-lg font-mono text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                −{formatCompactBTC(wallet.total_sent)}
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-mono ${netFlow >= 0 
                ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                : 'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
              }`}>
                {netFlow >= 0 ? '+' : ''}{formatCompactBTC(netFlow)}
              </span>
              {graphStats && (
                <span className="px-2.5 py-1 rounded-lg font-mono text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
                  {graphStats.total_nodes} nodes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-4 p-4 rounded-xl flex-shrink-0 min-w-[180px] ${riskBg} border`}>
          <div className="relative flex-shrink-0">
            <span className={`text-3xl font-bold ${riskColor} font-display`}>
              {riskScore}
            </span>
            <div className="absolute inset-0 rounded-xl border border-current/10" style={{ boxShadow: `0 0 20px ${getScoreGlow(riskScore)}` }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {getRiskLevelBadge(riskLevel)}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">Investigative Priority</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuickActions({ walletAddress, onNewSearch, onExport, onRefresh, isRefreshing, isExporting }) {
  return (
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Quick actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Tooltip content="Refresh investigation data" position="top">
        <motion.button
          onClick={onRefresh}
          disabled={isRefreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100/60 dark:bg-surface-800/60 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 rounded-lg hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/50 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh investigation"
        >
          <motion.span
            className="w-4 h-4"
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </motion.span>
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>
      </Tooltip>
      <Tooltip content="Export investigation data as JSON" position="top">
        <motion.button
          onClick={onExport}
          disabled={isExporting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100/60 dark:bg-surface-800/60 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 rounded-lg hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/50 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export data as JSON"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </motion.button>
      </Tooltip>
      <Tooltip content="Start a new wallet investigation" position="top">
        <motion.button
          onClick={onNewSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-900/20 backdrop-blur-xl border border-brand-200/50 dark:border-brand-800/50 rounded-lg hover:bg-brand-100/60 dark:hover:bg-brand-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/50 flex-shrink-0"
          aria-label="Start new search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">New Search</span>
        </motion.button>
      </Tooltip>
    </motion.div>
  )
}

export function TabNavigation({ activeTab, onTabChange, tabs, tabCounts }) {
  const handleKeyDown = (e, tabId) => {
    const tabIds = tabs.map(t => t.id)
    const currentIndex = tabIds.indexOf(tabId)
    let nextIndex = currentIndex

    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabIds.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabIds.length - 1
    else return

    e.preventDefault()
    onTabChange(tabIds[nextIndex])
    document.getElementById(`tab-${tabIds[nextIndex]}`)?.focus()
  }

  return (
    <div className="min-w-0" role="tablist" aria-label="Dashboard sections">
      <div className="card border-surface-200 dark:border-surface-700 overflow-hidden min-w-0" style={{
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" 
          style={{ background: 'linear-gradient(90deg, #06B6D4, #0ea5e9)' }} />
        
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          {tabs.map((tab) => {
            const count = tabCounts?.[tab.id]
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 relative focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-inset z-10 transition-colors duration-200
                  ${isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/20'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/50'
                  }`}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-brand-200 dark:bg-brand-800 text-brand-700 dark:text-brand-300' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
          <div 
            className="absolute bottom-0 h-1 transition-all duration-300 ease-out [&_*]:pointer-events-none"
            style={{
              left: `${100 / tabs.length * tabs.findIndex(t => t.id === activeTab)}%`,
              width: `${100 / tabs.length}%`,
              background: "linear-gradient(90deg, #06B6D4, #0ea5e9)",
              boxShadow: "0 0 12px rgba(6,182,212,0.5)"
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, description, actionLabel, onAction, icon, illustration }) {
  return (
    <div className="card p-10 text-center min-w-0" style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
    }}>
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)", border: '1px solid rgba(6,182,212,0.1)' }}>
        {illustration ? (
          <div className="w-full h-full flex items-center justify-center">{illustration}</div>
        ) : icon || (
          <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h3>
      <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary inline-flex items-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function SectionSkeleton({ variant = 'default' }) {
  const variants = {
    default: (
      <div className="card p-6 min-w-0 animate-pulse" style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
      }}>
        <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4 mb-5 animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-200 dark:bg-surface-700 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      </div>
    ),
    cards: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-w-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-200 dark:bg-surface-700 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    ),
    table: (
      <div className="card animate-pulse animate-shimmer min-w-0" style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
      }}>
        <div className="p-5 border-b border-surface-200 dark:border-surface-700">
          <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
        </div>
        <div className="table-container min-w-0">
          <table className="w-full min-w-max">
            <thead>
              <tr className="table-header">
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="table-header-cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" style={{ animationDelay: `${i * 50}ms` }} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-surface-100 dark:border-surface-800" style={{ animationDelay: `${i * 50}ms` }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    graph: (
      <div className="h-[500px] min-w-0">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4 animate-shimmer" />
        </div>
        <div className="h-full relative flex items-center justify-center text-surface-300 dark:text-surface-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
      </div>
    ),
  }

  return variants[variant] || variants.default
}

export default {}