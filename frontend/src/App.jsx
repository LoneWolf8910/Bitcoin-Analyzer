import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { WalletOverviewCards } from './components/WalletOverviewCards'
import { RiskSection } from './components/RiskSection'
import { TransactionStats } from './components/TransactionStats'
import { RecentTransactionsTable } from './components/RecentTransactionsTable'
import { LoadingOverlay, LoadingSpinner } from './components/Loading'
import { ErrorDisplay } from './components/Error'
import { SearchEmptyState } from './components/EmptyState'
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
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
        <Header />
        <LoadingOverlay message="Investigating wallet..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackendStatusBar health={backendHealth} />

        <section className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="page-title">Investigation Dashboard</h2>
              <p className="page-subtitle">Search for a wallet address or transaction ID to begin analysis</p>
            </div>
            {data && (
              <button
                onClick={handleNewSearch}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <div className="space-y-6 animate-slide-up" role="main">
            <WalletOverviewCards data={data} />

            <RiskSection data={data} />

            <div className="card-elevated overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <TransactionStats data={data} />
              </div>
              <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '200ms' }}>
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

      <footer className="border-t border-surface-200 dark:border-surface-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-surface-500 dark:text-surface-400">
            Bitcoin Transaction Analyzer • Smart India Hackathon 2026 • PS 26146 • Offline Mode
          </p>
        </div>
      </footer>
    </div>
  )
}

function BackendStatusBar({ health }) {
  if (!health) return null

  const isHealthy = health.status === 'ok' && health.offline

  return (
    <div className={`mb-6 px-4 py-3 rounded-xl border flex items-center justify-between gap-4 ${isHealthy
      ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
      : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
    }`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-success-500 animate-pulse-ring' : 'bg-danger-500'}`} aria-hidden="true" />
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          Backend: {isHealthy ? 'Online (Offline Mode)' : 'Offline'}
        </span>
        {health.trained_at && (
          <span className="text-xs text-surface-500 dark:text-surface-400 px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded-full font-mono">
            Model: {new Date(health.trained_at).toLocaleString()}
          </span>
        )}
      </div>
      <div className="text-xs text-surface-500 dark:text-surface-400 font-mono">
        {health.status} • {health.offline ? 'Air-gapped' : 'Connected'}
      </div>
    </div>
  )
}

function TransactionGraphSkeleton() {
  return (
    <div className="h-[500px] animate-pulse animate-shimmer">
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
    <div className="card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
      <h3 className="section-title">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        ML Anomaly Detection
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className={`p-4 rounded-xl ${is_anomaly
          ? 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
          : 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
        }`}>
          <p className="text-sm text-surface-500 dark:text-surface-400">Status</p>
          <p className={`text-3xl font-bold font-display ${is_anomaly ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
            {is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400">Anomaly Score</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100">{anomaly_score?.toFixed(4) ?? '—'}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400">Threshold</p>
          <p className="text-3xl font-bold font-mono text-surface-900 dark:text-surface-100">{threshold?.toFixed(4) ?? '—'}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400">Model Version</p>
          <p className="text-sm font-mono text-surface-900 dark:text-surface-100 truncate">{model_version}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-surface-500 dark:text-surface-400">
        Trained: {model_trained_at ? new Date(model_trained_at).toLocaleString() : 'Unknown'} •
        <span className="ml-2">Anomaly score represents deviation from normal behavioral patterns. Higher scores = more unusual.</span>
      </p>
    </div>
  )
}

export default App