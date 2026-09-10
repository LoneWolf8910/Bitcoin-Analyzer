import { formatBTC, formatNumber, formatCompactBTC } from '../utils/formatters.jsx'
import { getWalletLabelBadge } from '../utils/formatters.jsx'

export function TransactionStats({ data }) {
  if (!data?.features) {
    return <StatsSkeleton />
  }

  const f = data.features
  const wallet = data.wallet

  const stats = [
    { key: 'total_received', label: 'Total Received', value: formatBTC(f.total_received), color: 'text-success-600 dark:text-success-400', icon: 'in', iconBg: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' },
    { key: 'total_sent', label: 'Total Sent', value: formatBTC(f.total_sent), color: 'text-danger-600 dark:text-danger-400', icon: 'out', iconBg: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400' },
    { key: 'avg_amount', label: 'Avg Tx Amount', value: formatCompactBTC(f.average_transaction_amount), color: 'text-brand-600 dark:text-brand-400', icon: 'avg', iconBg: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' },
    { key: 'max_amount', label: 'Max Tx Amount', value: formatCompactBTC(f.maximum_transaction_amount), color: 'text-purple-600 dark:text-purple-400', icon: 'max', iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { key: 'incoming', label: 'Incoming Txs', value: formatNumber(f.incoming_count), color: 'text-success-600 dark:text-success-400', icon: 'in', iconBg: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' },
    { key: 'outgoing', label: 'Outgoing Txs', value: formatNumber(f.outgoing_count), color: 'text-danger-600 dark:text-danger-400', icon: 'out', iconBg: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400' },
    { key: 'counterparties', label: 'Unique Counterparties', value: formatNumber(f.unique_counterparties), color: 'text-info-600 dark:text-info-400', icon: 'cp', iconBg: 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400' },
    { key: 'ratio', label: 'In/Out Ratio', value: f.incoming_outgoing_ratio === Infinity ? '∞' : f.incoming_outgoing_ratio.toFixed(1), color: 'text-warning-600 dark:text-warning-400', icon: 'ratio', iconBg: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400' },
    { key: 'active_days', label: 'Active Days', value: formatNumber(f.active_days), color: 'text-surface-600 dark:text-surface-400', icon: 'days', iconBg: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400' },
    { key: 'frequency', label: 'Tx Frequency', value: `${f.transaction_frequency?.toFixed(1) ?? 0} /day`, color: 'text-brand-600 dark:text-brand-400', icon: 'freq', iconBg: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' },
    { key: 'avg_time', label: 'Avg Time Between', value: `${f.average_time_between_transactions?.toFixed(1) ?? 0} hrs`, color: 'text-surface-600 dark:text-surface-400', icon: 'time', iconBg: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400' },
    { key: 'burst', label: 'Burst Score', value: f.transaction_burst_score?.toFixed(3) ?? '—', color: 'text-orange-600 dark:text-orange-400', icon: 'burst', iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title">
          <svg className="w-5 h-5 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Transaction Statistics
        </h3>
        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-full">
          {data.graph?.nodes?.length ?? 0} nodes analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
        {stats.map((stat, index) => (
          <StatCard key={stat.key} stat={stat} delay={index * 30} />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400">Wallet Labels</h4>
          <span className="text-xs text-surface-400 dark:text-surface-500 font-mono px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded">
            {data.graph?.nodes?.length ?? 0} total
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <WalletLabelWrapper label={wallet?.dominant_label} isMain />
          {data.graph?.nodes && (
            <>
              {['normal', 'rapid_transfer', 'anomalous', 'high_activity'].map((label) => {
                const count = data.graph.nodes.filter(n => n.dominant_label === label).length
                if (count > 0) return <WalletLabelWrapper key={label} label={label} count={count} />
                return null
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ stat, delay }) {
  const icons = {
    in: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
    out: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5v2.25A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75V7.5m18-9l-4.5 4.5M12 3l4.5 4.5M12 3v13.5" /></svg>,
    avg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    max: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    cp: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    ratio: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    days: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    freq: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    time: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    burst: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  }

  const style = { animationDelay: `${delay}ms` }

  return (
    <div
      style={style}
      className="bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 rounded-xl p-4 card-hover animate-slide-up"
      role="listitem"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{stat.label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg} flex-shrink-0`}>
          {icons[stat.icon] || icons.avg}
        </span>
      </div>
      <div className={`stat-value ${stat.color}`}>
        {stat.value}
      </div>
    </div>
  )
}

function WalletLabelWrapper({ label, count, isMain }) {
  if (!label) return null

  const displayLabel = label.replace('_', ' ')

  if (isMain) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg" title="Primary wallet">
        <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-ring" aria-hidden="true" />
        {getWalletLabelBadge(label)}
        <span className="text-xs font-medium text-brand-700 dark:text-brand-300">Main</span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg" title={`${count} wallet(s)`}>
      {getWalletLabelBadge(label)}
      {count > 1 && (
        <span className="text-xs font-mono text-surface-500 dark:text-surface-400 px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">
          ×{count}
        </span>
      )}
    </span>
  )
}

function StatsSkeleton() {
  return (
    <div className="card p-6 animate-pulse animate-shimmer" role="status" aria-label="Loading statistics">
      <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4 mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
              <div className="w-9 h-9 bg-surface-200 dark:bg-surface-700 rounded-xl" />
            </div>
            <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}