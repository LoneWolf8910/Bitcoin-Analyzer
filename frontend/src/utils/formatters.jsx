export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '—'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toLocaleString()
}

export function formatBTC(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—'
  if (amount >= 1e8) return (amount / 1e8).toFixed(2) + ' BTC'
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) + ' BTC'
}

export function formatCompactBTC(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—'
  if (amount >= 1e8) return (amount / 1e8).toFixed(2) + ' BTC'
  if (amount >= 1) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' BTC'
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) + ' BTC'
}

export function formatTimestamp(isoString) {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function formatTime(isoString) {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export function truncateAddress(addr, start = 6, end = 4) {
  if (!addr) return ''
  if (addr.length <= start + end) return addr
  return `${addr.slice(0, start)}...${addr.slice(-end)}`
}

export function truncateTxId(txid, start = 8, end = 8) {
  if (!txid) return ''
  if (txid.length <= start + end) return txid
  return `${txid.slice(0, start)}...${txid.slice(-end)}`
}

export function getRiskLevelColor(level) {
  const colors = {
    LOW: 'text-success-600 dark:text-success-400',
    MEDIUM: 'text-warning-600 dark:text-warning-400',
    HIGH: 'text-orange-600 dark:text-orange-400',
    CRITICAL: 'text-danger-600 dark:text-danger-400',
  }
  return colors[level] || 'text-surface-500 dark:text-surface-400'
}

export function getRiskLevelBg(level) {
  const colors = {
    LOW: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800',
    MEDIUM: 'bg-warning-50 dark:bg-warning-900/30 border-warning-200 dark:border-warning-800',
    HIGH: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    CRITICAL: 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-800',
  }
  return colors[level] || 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
}

export function getRiskLevelBadge(level) {
  const badges = {
    LOW: <span className="badge-success">LOW</span>,
    MEDIUM: <span className="badge-warning">MEDIUM</span>,
    HIGH: <span className="badge-warning">HIGH</span>,
    CRITICAL: <span className="badge-danger">CRITICAL</span>,
    UNKNOWN: <span className="badge-neutral">UNKNOWN</span>,
  }
  return badges[level] || badges.UNKNOWN
}

export function getWalletLabelColor(label) {
  const colors = {
    normal: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    rapid_transfer: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800',
    anomalous: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    high_activity: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800',
  }
  return colors[label] || 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700'
}

export function getWalletLabelBadge(label) {
  const badges = {
    normal: <span className="badge-info">Normal</span>,
    rapid_transfer: <span className="badge-danger">Rapid Transfer</span>,
    anomalous: <span className="badge-warning">Anomalous</span>,
    high_activity: <span className="badge-warning">High Activity</span>,
  }
  return badges[label] || <span className="badge-neutral">{label?.replace('_', ' ') ?? 'Unknown'}</span>
}