import {
  MetricCard,
  BTCMetricCard,
  NumberMetricCard,
  RatioMetricCard,
  FrequencyMetricCard,
  TimeMetricCard,
  ScoreMetricCard,
  SkeletonCard,
} from './MetricCard.jsx'
import { getWalletLabelBadge } from '../utils/formatters.jsx'

export function TransactionStats({ data }) {
  if (!data?.features) {
    return <StatsSkeleton />
  }

  const f = data.features
  const wallet = data.wallet

  return (
    <div className="card p-6 animate-slide-up min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 min-w-0">
        <h3 className="section-title">
          <svg className="w-5 h-5 text-surface-400 dark:text-surface-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Transaction Statistics
        </h3>
        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-full flex-shrink-0">
          {data.graph?.nodes?.length ?? 0} nodes analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0" role="list">
        <BTCMetricCard
          label="Total Received"
          btcAmount={f.total_received}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
          iconBg="bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400"
          valueColor="text-success-600 dark:text-success-400"
          delay={0}
        />
        <BTCMetricCard
          label="Total Sent"
          btcAmount={f.total_sent}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5v2.25A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75V7.5m18-9l-4.5 4.5M12 3l4.5 4.5M12 3v13.5" />
            </svg>
          }
          iconBg="bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400"
          valueColor="text-danger-600 dark:text-danger-400"
          delay={30}
        />
        <BTCMetricCard
          label="Avg Tx Amount"
          btcAmount={f.average_transaction_amount}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconBg="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          valueColor="text-brand-600 dark:text-brand-400"
          delay={60}
        />
        <BTCMetricCard
          label="Max Tx Amount"
          btcAmount={f.maximum_transaction_amount}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          valueColor="text-purple-600 dark:text-purple-400"
          delay={90}
        />
        <NumberMetricCard
          label="Incoming Txs"
          number={f.incoming_count}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
          iconBg="bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400"
          valueColor="text-success-600 dark:text-success-400"
          delay={120}
        />
        <NumberMetricCard
          label="Outgoing Txs"
          number={f.outgoing_count}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5v2.25A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75V7.5m18-9l-4.5 4.5M12 3l4.5 4.5M12 3v13.5" />
            </svg>
          }
          iconBg="bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400"
          valueColor="text-danger-600 dark:text-danger-400"
          delay={150}
        />
        <NumberMetricCard
          label="Unique Counterparties"
          number={f.unique_counterparties}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBg="bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400"
          valueColor="text-info-600 dark:text-info-400"
          delay={180}
        />
        <RatioMetricCard
          label="In/Out Ratio"
          ratio={f.incoming_outgoing_ratio}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400"
          valueColor="text-warning-600 dark:text-warning-400"
          delay={210}
        />
        <NumberMetricCard
          label="Active Days"
          number={f.active_days}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
          valueColor="text-surface-600 dark:text-surface-400"
          delay={240}
        />
        <FrequencyMetricCard
          label="Tx Frequency"
          frequency={f.transaction_frequency}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          valueColor="text-brand-600 dark:text-brand-400"
          delay={270}
        />
        <TimeMetricCard
          label="Avg Time Between"
          hours={f.average_time_between_transactions}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
          valueColor="text-surface-600 dark:text-surface-400"
          delay={300}
        />
        <ScoreMetricCard
          label="Burst Score"
          score={f.transaction_burst_score}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          valueColor="text-orange-600 dark:text-orange-400"
          delay={330}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700 animate-fade-in min-w-0">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h4 className="text-sm font-medium text-surface-500 dark:text-surface-400">Wallet Labels</h4>
          <span className="text-xs text-surface-400 dark:text-surface-500 font-mono px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded flex-shrink-0">
            {data.graph?.nodes?.length ?? 0} total
          </span>
        </div>
        <div className="flex flex-wrap gap-2 min-w-0">
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

function WalletLabelWrapper({ label, count, isMain }) {
  if (!label) return null

  if (isMain) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg flex-shrink-0" title="Primary wallet">
        <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-ring" aria-hidden="true" />
        {getWalletLabelBadge(label)}
        <span className="text-xs font-medium text-brand-700 dark:text-brand-300">Main</span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg flex-shrink-0" title={`${count} wallet(s)`}>
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
    <div className="card p-6 animate-pulse animate-shimmer min-w-0" role="status" aria-label="Loading statistics">
      <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4 mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
        {[...Array(12)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}