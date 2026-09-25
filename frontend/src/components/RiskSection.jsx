import { getRiskLevelColor, getRiskLevelBg, getRiskLevelBadge } from '../utils/formatters.jsx'

export function RiskSection({ data }) {
  if (!data?.risk) return <RiskSkeleton />

  const { risk_score, risk_level, reasons } = data.risk
  const score = risk_score ?? 0
  const level = risk_level || 'UNKNOWN'

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-danger-600 dark:text-danger-400'
    if (s >= 60) return 'text-orange-600 dark:text-orange-400'
    if (s >= 30) return 'text-warning-600 dark:text-warning-400'
    return 'text-success-600 dark:text-success-400'
  }

  const getScoreBg = (s) => {
    if (s >= 80) return 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
    if (s >= 60) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    if (s >= 30) return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
    return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
  }

  return (
    <div className="card p-5 animate-slide-up min-w-0">
      <div className="flex items-center gap-4 mb-4 min-w-0">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${getScoreBg(score)}`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)} font-display`}>{score}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {getRiskLevelBadge(level)}
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Investigative Priority</p>
        </div>
      </div>

      <div className={`rounded-lg p-4 ${getRiskLevelBg(level)} border border-surface-200 dark:border-surface-700 min-w-0`}>
        {reasons && reasons.length > 0 ? (
          <ul className="space-y-2" role="list">
            {reasons.slice(0, 3).map((reason, index) => (
              <li key={index} className="text-sm text-surface-700 dark:text-surface-300 flex items-start gap-2 min-w-0">
                <span className="w-1.5 h-1.5 mt-2 flex-shrink-0 rounded-full" style={{ backgroundColor: getScoreColor(score).replace('text-', 'bg-').replace('dark:', 'dark:bg-') }} />
                <span className="break-words">{reason}</span>
              </li>
            ))}
            {reasons.length > 3 && (
              <li className="text-xs text-surface-500 dark:text-surface-400 pt-1">+{reasons.length - 3} more indicators</li>
            )}
          </ul>
        ) : (
          <p className="text-surface-500 dark:text-surface-400 text-sm">No significant risk indicators detected</p>
        )}
      </div>
    </div>
  )
}

function RiskSkeleton() {
  return (
    <div className="card p-5 animate-pulse animate-shimmer min-w-0">
      <div className="flex items-center gap-4 mb-4 min-w-0">
        <div className="w-16 h-16 rounded-xl bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
        <div className="space-y-2 min-w-0">
          <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
      <div className="h-16 bg-surface-100 dark:bg-surface-800 rounded-lg" />
    </div>
  )
}