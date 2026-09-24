import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { SearchBar } from './components/SearchBar'
import { WalletOverviewCards } from './components/WalletOverviewCards'
import { RiskSection } from './components/RiskSection'
import { TransactionStats } from './components/TransactionStats'
import { RecentTransactionsTable } from './components/RecentTransactionsTable'
import { LoadingOverlay, LoadingSpinner } from './components/Loading'
import { ErrorDisplay } from './components/Error'
import { SearchEmptyState } from './components/EmptyState'
import { Hero } from './components/ui/animated-hero'
import { GlassNavbar, TxGuardLogo } from './components/ui/glass-navbar'
import { useInvestigate } from './hooks/useInvestigate'
import { getHealth } from './services/api'

const TransactionGraph = lazy(() => import('./components/Graph/TransactionGraph').then(module => ({ default: module.TransactionGraph })))

function App() {
  const {
    data,
    loading,
    error,
    searchResults,
    investigate,
    search,
    clear,
  } = useInvestigate()

  const [backendHealth, setBackendHealth] = useState(null)
  const [showSearchEmpty, setShowSearchEmpty] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
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
    await investigate(walletAddress)
  }, [investigate])

  const handleSearch = useCallback((query) => {
    search(query)
  }, [search])

  const handleNewSearch = useCallback(() => {
    clear()
    setShowSearchEmpty(true)
  }, [clear])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 min-w-0 pt-16">
        <GlassNavbar backendHealth={backendHealth} />
        <LoadingOverlay message="Investigating wallet..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 min-w-0 pt-16">
      <GlassNavbar backendHealth={backendHealth} />

      {!data && !loading && !error && !searchResults && (
        <Hero />
      )}

      <main id="investigation-dashboard" className="container-page py-6 sm:py-8 min-w-0">

        <section className="mb-8 animate-fade-in min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-w-0">
            <div className="min-w-0">
              <h2 className="page-title">Investigation Dashboard</h2>
              <p className="page-subtitle">Search for a wallet address or transaction ID to begin analysis</p>
            </div>
            {data && (
              <button
                onClick={handleNewSearch}
                className="btn-secondary flex items-center gap-2 flex-shrink-0"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Search
              </button>
            )}
          </div>

          <SearchBar
            onSearch={handleSearch}
            onInvestigate={handleInvestigate}
            searchResults={searchResults}
            loading={loading}
            disabled={loading}
          />

          {showSearchEmpty && !data && !searchResults && (
            <SearchEmptyState onSearch={() => setShowSearchEmpty(false)} />
          )}
        </section>

        {error && !data && (
          <ErrorDisplay
            message={error}
            onRetry={() => handleInvestigate(data?.wallet?.wallet_address)}
          />
        )}

        {data && (
          <div className="space-y-6 animate-slide-up min-w-0" role="main">
            <WalletOverviewCards data={data} />

            <RiskSection data={data} />

            <div className="card-elevated overflow-hidden animate-slide-up min-w-0" style={{ animationDelay: '100ms' }}>
              <Suspense fallback={<TransactionGraphSkeleton />}>
                <TransactionGraph
                  data={data.graph}
                  walletAddress={data.wallet.wallet_address}
                  depth={2}
                  onDepthChange={() => {}}
                  onNodeClick={(node) => console.log('Node clicked:', node)}
                  onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
                />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
              <div className="lg:col-span-2 animate-slide-up min-w-0" style={{ animationDelay: '150ms' }}>
                <TransactionStats data={data} />
              </div>
              <div className="lg:col-span-1 animate-slide-up min-w-0" style={{ animationDelay: '200ms' }}>
                <RecentTransactionsTable
                  transactions={data.recent_transactions}
                  loading={false}
                  error={null}
                />
              </div>
            </div>

            {data.anomaly && !data.anomaly.error && (
              <AnomalyInfo anomaly={data.anomaly} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-surface-200/50 dark:border-surface-700/50 mt-16 min-w-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(234, 242, 250, 0.5) 100%)" }}>
        <div className="container-page py-10 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand column */}
            <div className="md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 50%, #06B6D4 100%)", boxShadow: "0 4px 16px rgba(6, 182, 212, 0.35)" }}>
                  <TxGuardLogo />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 font-display tracking-tight text-lg">TxGuard</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">Transaction Guardian</p>
                </div>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 max-w-md leading-relaxed">
                Offline AI-powered Bitcoin transaction analysis. Detect anomalies, assess risk, and visualize transaction graphs in air-gapped environments.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium" style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.25)", color: "#15803d" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                  OFFLINE MODE
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium" style={{ background: "rgba(6, 182, 212, 0.12)", border: "1px solid rgba(6, 182, 212, 0.25)", color: "#0E7490" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#06B6D4" }} />
                  AIR-GAPPED
                </span>
              </div>
            </div>

            {/* Links column */}
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Transactions</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Risk Scoring</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Graph Visualization</a></li>
              </ul>
            </div>

            {/* Resources column */}
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Offline Architecture</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">ML Model Info</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-surface-200/50 dark:border-surface-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              TxGuard &copy; {new Date().getFullYear()} &mdash; Built for offline Bitcoin analysis
            </p>
            <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
              <span className="font-mono">v0.1.0</span>
              <span className="hidden sm:inline">|</span>
              <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</a>
              <span className="hidden sm:inline">|</span>
              <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">License</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TransactionGraphSkeleton() {
  return (
    <div className="h-[500px] animate-pulse animate-shimmer min-w-0">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
      </div>
      <div className="h-full" />
    </div>
  )
}

function AnomalyInfo({ anomaly }) {
  const { is_anomaly, anomaly_score, threshold, model_version, model_trained_at } = anomaly

  return (
    <div className="card p-6 animate-slide-up min-w-0" style={{ animationDelay: '250ms' }}>
      <h3 className="section-title">
        <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        ML Anomaly Detection
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 min-w-0">
        <div className={`p-4 rounded-xl ${is_anomaly
          ? 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
          : 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
        }`}>
          <p className="text-sm text-surface-500 dark:text-surface-400">Status</p>
          <p className={`text-3xl font-bold font-display ${is_anomaly ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'} truncate`}>
            {is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0">
          <p className="text-sm text-surface-500 dark:text-surface-400">Anomaly Score</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100 truncate">{anomaly_score?.toFixed(4) ?? '—'}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0">
          <p className="text-sm text-surface-500 dark:text-surface-400">Threshold</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100 truncate">{threshold?.toFixed(4) ?? '—'}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 min-w-0">
          <p className="text-sm text-surface-500 dark:text-surface-400">Model Version</p>
          <p className="text-sm font-mono text-surface-900 dark:text-surface-100 truncate">{model_version}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-surface-500 dark:text-surface-400 break-words">
        Trained: {model_trained_at ? new Date(model_trained_at).toLocaleString() : 'Unknown'} •
        <span className="ml-2">Anomaly score represents deviation from normal behavioral patterns. Higher scores = more unusual.</span>
      </p>
    </div>
  )
}

export default App