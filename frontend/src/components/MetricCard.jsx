import { formatNumber, formatBTC } from '../utils/formatters.jsx'
import { getRiskLevelBadge } from '../utils/formatters.jsx'

const METRIC_CARD_MIN_HEIGHT = '140px'

export function MetricCard({
  label,
  value,
  icon,
  iconBg,
  valueColor = 'text-surface-900 dark:text-surface-100',
  trend,
  trendLabel,
  delay = 0,
  className = '',
}) {
  const style = { 
    animationDelay: `${delay}ms`,
    minHeight: METRIC_CARD_MIN_HEIGHT,
  }

  return (
    <div
      style={style}
      className={`card p-5 card-hover animate-slide-up min-w-0 flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <p className="stat-label truncate">{label}</p>
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`stat-value ${valueColor} break-words flex-1`}>
        {value}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {getRiskLevelBadge(trend)}
          <span className="text-xs text-surface-500 dark:text-surface-400">{trendLabel || 'Level'}</span>
        </div>
      )}
    </div>
  )
}

export function BTCMetricCard({ label, btcAmount, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = formatBTC(btcAmount)
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function NumberMetricCard({ label, number, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = formatNumber(number)
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function RatioMetricCard({ label, ratio, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = ratio === Infinity ? '∞' : Number(ratio).toFixed(1)
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function FrequencyMetricCard({ label, frequency, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = `${Number(frequency || 0).toFixed(1)} /day`
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function TimeMetricCard({ label, hours, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = `${Number(hours || 0).toFixed(1)} hrs`
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function ScoreMetricCard({ label, score, icon, iconBg, valueColor, trend, trendLabel, delay, className }) {
  const formatted = Number(score || 0).toFixed(3)
  return (
    <MetricCard
      label={label}
      value={formatted}
      icon={icon}
      iconBg={iconBg}
      valueColor={valueColor}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
      className={className}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse animate-shimmer min-w-0" style={{ minHeight: METRIC_CARD_MIN_HEIGHT }}>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
        <div className="w-11 h-11 bg-surface-200 dark:bg-surface-700 rounded-xl flex-shrink-0" />
      </div>
      <div className="h-9 bg-surface-200 dark:bg-surface-700 rounded w-1/2 flex-1" />
      <div className="mt-3 h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
    </div>
  )
}