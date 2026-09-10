import { formatNumber, formatBTC } from '../utils/formatters.jsx'
import { getRiskLevelBadge } from '../utils/formatters.jsx'

const cards = [
  {
    key: 'risk_score',
    label: 'Risk Score',
    value: (data) => data?.risk?.risk_score ?? '—',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    iconBg: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    trend: (data) => data?.risk?.risk_level,
    trendLabel: 'Priority',
  },
  {
    key: 'transactions',
    label: 'Transactions',
    value: (data) => formatNumber(data?.wallet?.transaction_count ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBg: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  },
  {
    key: 'btc_received',
    label: 'BTC Received',
    value: (data) => formatBTC(data?.wallet?.total_received ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    iconBg: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  },
  {
    key: 'btc_sent',
    label: 'BTC Sent',
    value: (data) => formatBTC(data?.wallet?.total_sent ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5v2.25A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75V7.5m18-9l-4.5 4.5M12 3l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    iconBg: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
  },
  {
    key: 'net_flow',
    label: 'Net Flow',
    value: (data) => formatBTC(data?.wallet?.net_flow ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2m7-12a2 2 0 012 2v4H7V9a2 2 0 012-2h10z" />
      </svg>
    ),
    iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    key: 'connected_wallets',
    label: 'Connected Wallets',
    value: (data) => formatNumber(data?.graph?.stats?.total_nodes ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    iconBg: 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400',
  },
]

export function WalletOverviewCards({ data }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" role="status" aria-label="Loading wallet overview">
        {cards.map(() => <SkeletonCard key={Math.random()} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" role="region" aria-label="Wallet overview">
      {cards.map((card, index) => (
        <OverviewCard
          key={card.key}
          card={card}
          data={data}
          delay={index * 50}
        />
      ))}
    </div>
  )
}

function OverviewCard({ card, data, delay }) {
  const style = { animationDelay: `${delay}ms` }

  const value = card.value(data)
  const isRiskCard = card.key === 'risk_score'
  const isNetFlow = card.key === 'net_flow'

  let valueColor = 'text-surface-900 dark:text-surface-100'
  if (isNetFlow) {
    const netFlow = data?.wallet?.net_flow ?? 0
    valueColor = netFlow >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
  } else if (isRiskCard) {
    const score = data?.risk?.risk_score ?? 0
    if (score >= 80) valueColor = 'text-danger-600 dark:text-danger-400'
    else if (score >= 60) valueColor = 'text-orange-600 dark:text-orange-400'
    else if (score >= 30) valueColor = 'text-warning-600 dark:text-warning-400'
    else valueColor = 'text-success-600 dark:text-success-400'
  }

  return (
    <div
      key={card.key}
      style={style}
      className="card p-5 card-hover animate-slide-up"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="stat-label">{card.label}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} flex-shrink-0 ml-3`}>
          {card.icon}
        </div>
      </div>
      <div className={`stat-value ${valueColor}`}>
        {value}
      </div>
      {card.trend && (
        <div className="mt-3 flex items-center gap-2">
          {getRiskLevelBadge(card.trend(data))}
          <span className="text-xs text-surface-500 dark:text-surface-400">{card.trendLabel || 'Level'}</span>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse animate-shimmer">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
        <div className="w-11 h-11 bg-surface-200 dark:bg-surface-700 rounded-xl" />
      </div>
      <div className="h-9 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
      <div className="mt-3 h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
    </div>
  )
}