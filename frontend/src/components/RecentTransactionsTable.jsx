import { formatTimestamp, formatCompactBTC, truncateAddress, truncateTxId, getWalletLabelColor } from '../utils/formatters.jsx'

export function RecentTransactionsTable({ transactions, loading, error }) {
  if (loading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="card p-6 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800">
        <div className="flex items-center gap-3 text-danger-700 dark:text-danger-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>Failed to load transactions: {error}</p>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-surface-500 dark:text-surface-400">No recent transactions found</p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">This wallet has no recorded transactions in the dataset</p>
      </div>
    )
  }

  const mainWallet = transactions[0]?.input_wallet === transactions[0]?.output_wallet ? null : transactions[0]?.input_wallet

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="section-title">
          <svg className="w-5 h-5 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Recent Transactions
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-surface-500 dark:text-surface-400 font-mono px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full">
            {transactions.length} transactions
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Time</th>
              <th className="table-header-cell">TXID</th>
              <th className="table-header-cell">Direction</th>
              <th className="table-header-cell text-right pr-4">Amount (BTC)</th>
              <th className="table-header-cell">Counterparty</th>
              <th className="table-header-cell">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {transactions.map((tx, index) => (
              <TransactionRow key={tx.id ?? index} tx={tx} walletAddress={mainWallet} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionRow({ tx, walletAddress }) {
  const isOutgoing = walletAddress && tx.input_wallet === walletAddress
  const counterparty = isOutgoing ? tx.output_wallet : tx.input_wallet
  const amount = isOutgoing ? tx.output_amount : tx.input_amount
  const amountColor = isOutgoing ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
  const directionBg = isOutgoing ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300' : 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
  const directionIcon = isOutgoing ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2m7-12a2 2 0 012 2v4H7V9a2 2 0 012-2h10z" /></svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
  )

  return (
    <tr className="table-row group" tabIndex={0}>
      <td className="table-cell font-mono whitespace-nowrap text-surface-700 dark:text-surface-300">
        {formatTimestamp(tx.timestamp)}
      </td>
      <td className="table-cell">
        <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate max-w-[200px] block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" title={tx.txid}>
          {truncateTxId(tx.txid)}
        </span>
      </td>
      <td className="table-cell">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${directionBg}`}>
          {directionIcon}
          <span>{isOutgoing ? 'OUT' : 'IN'}</span>
        </span>
      </td>
      <td className="table-cell text-right pr-4">
        <span className={`font-mono text-sm font-medium ${amountColor}`}>
          {isOutgoing ? '−' : '+'}{formatCompactBTC(amount)}
        </span>
      </td>
      <td className="table-cell">
        <span className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate max-w-[180px] block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" title={counterparty}>
          {truncateAddress(counterparty)}
        </span>
      </td>
      <td className="table-cell">
        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getWalletLabelColor(tx.wallet_label)}`}>
          {tx.wallet_label?.replace('_', ' ') ?? 'unknown'}
        </span>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <div className="card animate-pulse animate-shimmer" role="status" aria-label="Loading transactions">
      <div className="p-5 border-b border-surface-200 dark:border-surface-700">
        <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell" /><th className="table-header-cell" /><th className="table-header_cell" />
              <th className="table_header_cell" /><th className="table_header_cell" /><th className="table_header_cell" />
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t border-surface-100 dark:border-surface-800">
                <td className="table_cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-28" /></td>
                <td className="table_cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-40" /></td>
                <td className="table_cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20" /></td>
                <td className="table_cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24" /></td>
                <td className="table_cell"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32" /></td>
                <td className="table_cell"><div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}