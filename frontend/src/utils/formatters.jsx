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
  if (amount >= 1) return amount.toFixed(8) + ' BTC'
  return amount.toFixed(8) + ' BTC'
}

export function formatCompactBTC(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—'
  if (amount >= 1) return amount.toFixed(4) + ' BTC'
  return amount.toFixed(8) + ' BTC'
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
    LOW: 'text-success',
    MEDIUM: 'text-warning',
    HIGH: 'text-orange-600',
    CRITICAL: 'text-danger',
  }
  return colors[level] || 'text-surface-500'
}

export function getRiskLevelBg(level) {
  const colors = {
    LOW: 'bg-success-light border-success/30',
    MEDIUM: 'bg-warning-light border-warning/30',
    HIGH: 'bg-orange-100 border-orange-200',
    CRITICAL: 'bg-danger-light border-danger/30',
  }
  return colors[level] || 'bg-surface-100 border-surface-200'
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
    normal: 'bg-brand-light text-brand-700 border-brand/20',
    rapid_transfer: 'bg-danger-light text-danger border-danger/20',
    anomalous: 'bg-purple-100 text-purple-700 border-purple-200',
    high_activity: 'bg-warning-light text-warning border-warning/20',
  }
  return colors[label] || 'bg-surface-100 text-surface-600 border-surface-200'
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