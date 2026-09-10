import { getRiskLevelColor, getRiskLevelBg, getRiskLevelBadge } from '../utils/formatters.jsx'

export function RiskSection({ data }) {
  if (!data?.risk) {
    return <RiskSkeleton />
  }

  const { risk_score, risk_level, reasons, factor_breakdown } = data.risk
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

  const findFactor = (name) => factor_breakdown?.find(f => f.factor === name)?.weighted_contribution ?? 0

  return (
    <div className="card p-6 animate-slide-up min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-28 h-28 rounded-2xl flex items-center justify-center relative flex-shrink-0 ${getScoreBg(score)}`}>
            <span className={`text-5xl font-bold ${getScoreColor(score)} font-display`}>
              {score}
            </span>
            <div className="absolute inset-0 rounded-2xl border-4 border-transparent" style={{
              borderTopColor: getScoreColor(score).replace('text-', '').replace('dark:', ''),
              borderRightColor: getScoreColor(score).replace('text-', '').replace('dark:', ''),
              opacity: 0.3
            }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Investigative Priority</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {getRiskLevelBadge(level)}
              <RiskLevelBar score={score} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700 pt-4 lg:border-0 lg:pt-0 lg:border-l lg:pl-6 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-lg flex-shrink-0">
            <span className="font-mono text-surface-700 dark:text-surface-300">{score}/100</span>
          </div>
          <FactorBadge label="ML Anomaly" value={findFactor('ml_anomaly')} color="purple" />
          <FactorBadge label="Tx Behavior" value={findFactor('transaction_behavior')} color="brand" />
          <FactorBadge label="Graph" value={findFactor('graph_behavior')} color="info" />
          <FactorBadge label="Rapid Move" value={findFactor('rapid_movement')} color="danger" />
          <FactorBadge label="Frequency" value={findFactor('frequency')} color="warning" />
          <FactorBadge label="CP Concentration" value={findFactor('counterparty_concentration')} color="success" />
        </div>
      </div>

      <div className={`rounded-xl p-5 ${getRiskLevelBg(level)} border border-surface-200 dark:border-surface-700 min-w-0`}>
        <h3 className={`font-semibold ${getRiskLevelColor(level)} mb-4 flex items-center gap-2 truncate`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Risk Indicators
        </h3>
        {reasons && reasons.length > 0 ? (
          <ul className="space-y-3" role="list">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300 group min-w-0">
                <div className={`w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center rounded-full ${getScoreBg(score)}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="leading-relaxed break-words">{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400 py-2 min-w-0">
            <svg className="w-5 h-5 text-success-500 dark:text-success-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="break-words">No significant risk indicators detected. This wallet appears to have normal transaction patterns.</span>
          </div>
        )}
      </div>

      {factor_breakdown && factor_breakdown.length > 0 && (
        <details className="mt-6 group min-w-0">
          <summary className="flex items-center justify-between cursor-pointer text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 font-medium p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-0">
            <span className="flex items-center gap-2 truncate">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Factor Breakdown
            </span>
            <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-4 space-y-3 pt-4 border-t border-surface-200 dark:border-surface-700 animate-slide-down min-w-0">
            {factor_breakdown.map((factor) => (
              <FactorRow key={factor.factor} factor={factor} scoreColor={getScoreColor(score)} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function FactorBadge({ label, value, color }) {
  const colorMap = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800',
    info: 'bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-300 border-info-200 dark:border-info-800',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  }

  const getValueColor = (v) => {
    if (v > 10) return 'text-danger-600 dark:text-danger-400'
    if (v > 5) return 'text-warning-600 dark:text-warning-400'
    if (v > 1) return 'text-brand-600 dark:text-brand-400'
    return 'text-success-600 dark:text-success-400'
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colorMap[color]} flex-shrink-0`}>
      <span className="text-xs text-surface-500 dark:text-surface-400 truncate">{label}</span>
      <span className={`font-mono font-bold ${getValueColor(value)}`}>{value.toFixed(1)}%</span>
    </div>
  )
}

function RiskLevelBar({ score }) {
  const getColor = (s) => {
    if (s >= 80) return 'bg-danger-500'
    if (s >= 60) return 'bg-orange-500'
    if (s >= 30) return 'bg-warning-500'
    return 'bg-success-500'
  }

  return (
    <div className="w-40 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden flex-shrink-0">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${getColor(score)}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score ${score} out of 100`}
      />
    </div>
  )
}

function FactorRow({ factor, scoreColor }) {
  const { factor: name, raw_score, weighted_contribution, explanation, feature_values } = factor

  const formatName = (str) => str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const getContributionColor = (value) => {
    if (value > 10) return 'text-danger-600 dark:text-danger-400'
    if (value > 5) return 'text-warning-600 dark:text-warning-400'
    if (value > 1) return 'text-brand-600 dark:text-brand-400'
    return 'text-success-600 dark:text-success-400'
  }

  return (
    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 min-w-0">
        <h4 className="font-medium text-surface-900 dark:text-surface-100 capitalize truncate">{formatName(name)}</h4>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-surface-500 dark:text-surface-400">Raw: <span className="text-surface-900 dark:text-surface-100 font-mono">{raw_score?.toFixed(1) ?? 0}</span></span>
          <span className={`font-bold ${getContributionColor(weighted_contribution)}`}>
            Weighted: {weighted_contribution?.toFixed(1) ?? 0}%
          </span>
        </div>
      </div>
      <p className="text-surface-600 dark:text-surface-400 text-sm mb-3 break-words">{explanation}</p>
      {feature_values && Object.keys(feature_values).length > 0 && (
        <details className="group min-w-0">
          <summary className="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <span>Feature values</span>
            <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0">
            {Object.entries(feature_values).map(([key, value]) => (
              <div key={key} className="bg-surface-100 dark:bg-surface-800 rounded-lg p-2.5 font-mono text-xs min-w-0">
                <span className="text-surface-500 dark:text-surface-400 block truncate">{key}</span>
                <span className="text-surface-900 dark:text-surface-100 break-words">{typeof value === 'number' ? value.toFixed(4) : value}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function RiskSkeleton() {
  return (
    <div className="card p-6 animate-pulse animate-shimmer min-w-0">
      <div className="flex items-center gap-6 mb-6 min-w-0">
        <div className="w-28 h-28 rounded-2xl bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
        <div className="flex-1 space-y-3 min-w-0">
          <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
      <div className="h-24 bg-surface-100 dark:bg-surface-800 rounded-xl" />
    </div>
  )
}