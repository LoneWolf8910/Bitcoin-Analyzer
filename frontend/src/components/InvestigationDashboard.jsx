import { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchBar } from './SearchBar'
import { WalletOverviewCards } from './WalletOverviewCards'
import { RiskSection } from './RiskSection'
import { TransactionStats } from './TransactionStats'
import { RecentTransactionsTable } from './RecentTransactionsTable'
import { ErrorDisplay } from './Error'
import { SearchEmptyState } from './EmptyState'
import { TabNavigation, EmptyState, SectionSkeleton, WalletHeader } from '@/components/ui/dashboard-elements'
import { DashboardNavbar } from '@/components/ui/DashboardNavbar'
import { useInvestigate } from '../hooks/useInvestigate'
import { formatCompactBTC, truncateAddress } from '../utils/formatters.jsx'

const TransactionGraph = lazy(() => import('./Graph/TransactionGraph').then(module => ({ default: module.TransactionGraph })))

export function InvestigationDashboard({ initialWalletAddress, onBackToLanding }) {
  const {
    data,
    loading,
    error,
    searchResults,
    investigate,
    search,
    clear,
  } = useInvestigate()

  const [showSearchEmpty, setShowSearchEmpty] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dashboardRef = useRef(null)
  const [backendHealth, setBackendHealth] = useState(null)

  useEffect(() => {
    if (initialWalletAddress) {
      setShowSearchEmpty(false)
      setActiveTab('overview')
      investigate(initialWalletAddress)
    }
  }, [initialWalletAddress, investigate])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { getHealth } = await import('../services/api')
        const health = await getHealth()
        setBackendHealth(health)
      } catch {
        setBackendHealth({ status: 'error', offline: false })
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleInvestigate = useCallback(async (walletAddress) => {
    setShowSearchEmpty(false)
    setActiveTab('overview')
    await investigate(walletAddress)
    setShowMobileMenu(false)
  }, [investigate])

  const handleSearch = useCallback((query) => {
    search(query)
  }, [search])

  const handleNewSearch = useCallback(() => {
    clear()
    setShowSearchEmpty(true)
    setActiveTab('overview')
  }, [clear])

  const handleRefresh = useCallback(async () => {
    if (!data?.wallet?.wallet_address) return
    setIsRefreshing(true)
    try {
      await investigate(data.wallet.wallet_address)
    } finally {
      setIsRefreshing(false)
    }
  }, [data?.wallet?.wallet_address, investigate])

  const handleExport = useCallback(async () => {
    if (!data) return
    setIsExporting(true)
    try {
      exportData(data)
    } finally {
      setIsExporting(false)
    }
  }, [data])

  const handleBackToLanding = useCallback(() => {
    clear()
    onBackToLanding?.()
  }, [clear, onBackToLanding])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('[data-search-input]')
        searchInput?.focus()
      }
      if (e.key === 'Escape') {
        const searchInput = document.querySelector('[data-search-input]')
        if (searchInput === document.activeElement) {
          searchInput.blur()
        }
        if (showMobileMenu) {
          setShowMobileMenu(false)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMobileMenu])

  const tabCounts = data ? {
    overview: 0,
    transactions: data.recent_transactions?.length ?? 0,
    graph: data.graph?.nodes?.length ?? 0,
    risk: data.risk?.factor_breakdown?.length ?? 0,
    stats: 12,
  } : {}

  const walletAddr = data?.wallet?.wallet_address
  const riskScore = data?.risk?.risk_score ?? 0
  const riskLevel = data?.risk?.risk_level || 'UNKNOWN'
  const lastUpdated = data?.last_updated ? new Date(data.last_updated).toLocaleString() : null

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 min-w-0">
      <DashboardNavbar
        walletAddress={walletAddr}
        riskScore={riskScore}
        riskLevel={riskLevel}
        backendHealth={backendHealth}
        lastUpdated={lastUpdated}
        onNewSearch={handleNewSearch}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onBack={handleBackToLanding}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
        showMobileMenu={showMobileMenu}
        onToggleMenu={setShowMobileMenu}
      />

      <motion.main
        id="investigation-dashboard"
        ref={dashboardRef}
        className="container-page pt-20 pb-12 min-w-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Search Section */}
        <motion.section
          className="mb-8 min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="max-w-2xl mx-auto mb-6">
            <h1 className="sr-only">Search Wallet or Transaction</h1>
            <SearchBar
              onSearch={handleSearch}
              onInvestigate={handleInvestigate}
              searchResults={searchResults}
              loading={loading}
              disabled={loading}
            />
          </div>

          {data && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <h2 className="page-title">Investigation Dashboard</h2>
                <p className="page-subtitle">
                  Analyzing wallet: <span className="font-mono text-brand-600 dark:text-brand-400">{truncateAddress(walletAddr)}</span>
                  {lastUpdated && <span className="ml-3 text-xs text-surface-400 dark:text-surface-500">Updated {lastUpdated}</span>}
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* Empty Search State */}
        {showSearchEmpty && !data && !searchResults && (
          <motion.section
            className="mb-8 min-w-0 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SearchEmptyState onSearch={() => setShowSearchEmpty(false)} />
          </motion.section>
        )}

        {/* Error State */}
        {error && !data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ErrorDisplay
              message={error}
              onRetry={() => handleInvestigate(data?.wallet?.wallet_address)}
            />
          </motion.div>
        )}

        {/* Dashboard Content */}
        {data && (
          <AnimatePresence mode="wait">
            <>
              {/* Wallet Header */}
              <motion.div
                key="wallet-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <WalletHeader
                  wallet={data.wallet}
                  risk={data.risk}
                  graphStats={data.graph?.stats}
                  lastUpdated={data.last_updated || Date.now()}
                />
              </motion.div>

              {/* Tab Navigation */}
              <motion.div
                key="tabs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab)
                    setShowMobileMenu(false)
                  }}
                  tabs={[
                    { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { id: 'transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                    { id: 'graph', label: 'Graph', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                    { id: 'risk', label: 'Risk Analysis', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { id: 'stats', label: 'Statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  ]}
                  tabCounts={tabCounts}
                />
              </motion.div>

              {/* Tab Panels */}
              <motion.div
                key={activeTab}
                className="space-y-6 min-w-0"
                role="tabpanel"
                aria-label={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {activeTab === 'overview' && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <WalletOverviewCards data={data} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                    >
                      <RiskSection data={data} />
                    </motion.div>
                    <motion.div
                      className="card-elevated overflow-hidden min-w-0"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <Suspense fallback={<SectionSkeleton variant="graph" />}>
                        <TransactionGraph
                          data={data.graph}
                          walletAddress={walletAddr}
                          depth={2}
                          onDepthChange={() => {}}
                          onNodeClick={(node) => console.log('Node clicked:', node)}
                          onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
                        />
                      </Suspense>
                    </motion.div>
                    {data.anomaly && !data.anomaly.error && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                      >
                        <AnomalyInfo anomaly={data.anomaly} />
                      </motion.div>
                    )}
                  </>
                )}

                {activeTab === 'transactions' && (
                  <motion.div
                    className="card min-w-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <RecentTransactionsTable
                      transactions={data.recent_transactions}
                      loading={false}
                      error={null}
                      walletAddress={walletAddr}
                    />
                  </motion.div>
                )}

                {activeTab === 'graph' && (
                  <motion.div
                    className="card-elevated overflow-hidden min-w-0 h-[700px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Suspense fallback={<SectionSkeleton variant="graph" />}>
                      <TransactionGraph
                        data={data.graph}
                        walletAddress={walletAddr}
                        depth={2}
                        onDepthChange={() => {}}
                        onNodeClick={(node) => console.log('Node clicked:', node)}
                        onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
                      />
                    </Suspense>
                  </motion.div>
                )}

                {activeTab === 'risk' && (
                  <motion.div
                    className="space-y-6 min-w-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <RiskSection data={data} />
                    {data.anomaly && !data.anomaly.error && (
                      <AnomalyInfo anomaly={data.anomaly} />
                    )}
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    className="min-w-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TransactionStats data={data} />
                  </motion.div>
                )}
              </motion.div>
            </>
          </AnimatePresence>
        )}

        {/* Search Results */}
        {!data && !loading && !error && searchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              title="Search Results Found"
              description="Select a wallet from the search results below to start a detailed investigation"
              actionLabel="Clear Search"
              onAction={handleNewSearch}
              illustration={
                <svg className="w-12 h-12 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </motion.div>
        )}
      </motion.main>

      <motion.footer
        className="border-t border-surface-200/50 dark:border-surface-700/50 mt-12 py-6 min-w-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #06B6D4, #0891AE)" }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 font-display">TxGuard</span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">Offline Bitcoin analysis &mdash; v0.1.0</p>
        </div>
      </motion.footer>
    </div>
  )
}

function exportData(data) {
  const exportObj = {
    wallet: data.wallet,
    risk: data.risk,
    anomaly: data.anomaly,
    features: data.features,
    graph: {
      nodes: data.graph?.nodes?.length ?? 0,
      edges: data.graph?.edges?.length ?? 0,
      stats: data.graph?.stats
    },
    recent_transactions: data.recent_transactions,
    exported_at: new Date().toISOString(),
    version: '0.1.0'
  }
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `txguard-${data.wallet.wallet_address.slice(0,8)}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function AnomalyInfo({ anomaly }) {
  const { is_anomaly, anomaly_score, threshold, model_version, model_trained_at } = anomaly

  return (
    <motion.div
      className="card p-6 min-w-0 border-l-4 border-purple-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h3 className="section-title flex items-center gap-2">
        <span className="w-5 h-5 text-purple-500 flex-shrink-0">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
        ML Anomaly Detection
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 min-w-0">
        <motion.div
          className={`p-4 rounded-xl ${is_anomaly
            ? 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
            : 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-sm text-surface-500 dark:text-surface-400">Status</p>
          <p className={`text-3xl font-bold font-display ${is_anomaly ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'} truncate`}>
            {is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
          </p>
        </motion.div>
        <motion.div
          className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <p className="text-sm text-surface-500 dark:text-surface-400">Anomaly Score</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100 truncate">{anomaly_score?.toFixed(4) ?? '—'}</p>
        </motion.div>
        <motion.div
          className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <p className="text-sm text-surface-500 dark:text-surface-400">Threshold</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100 truncate">{threshold?.toFixed(4) ?? '—'}</p>
        </motion.div>
        <motion.div
          className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <p className="text-sm text-surface-500 dark:text-surface-400">Model Version</p>
          <p className="text-sm font-mono text-surface-900 dark:text-surface-100 truncate">{model_version}</p>
        </motion.div>
      </div>

      <p className="mt-4 text-xs text-surface-500 dark:text-surface-400 break-words">
        Trained: {model_trained_at ? new Date(model_trained_at).toLocaleString() : 'Unknown'} &middot;
        <span className="ml-2">Anomaly score represents deviation from normal behavioral patterns. Higher scores = more unusual.</span>
      </p>
    </motion.div>
  )
}