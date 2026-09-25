"use client"

import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

interface RiskGaugeProps {
  score: number
  level: string
  size?: number
  showLabel?: boolean
  animate?: boolean
  className?: string
}

export function RiskGauge({ 
  score, 
  level, 
  size = 160, 
  showLabel = true, 
  animate = true,
  className = ""
}: RiskGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const currentScoreRef = useRef(0)

  const clampedScore = Math.max(0, Math.min(100, score))
  
  const getColor = useMemo(() => {
    if (clampedScore >= 80) return { main: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)', light: '#FEE2E2' }
    if (clampedScore >= 60) return { main: '#F97316', glow: 'rgba(249, 115, 22, 0.6)', light: '#FFEDD5' }
    if (clampedScore >= 30) return { main: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)', light: '#FEF3C7' }
    return { main: '#22C55E', glow: 'rgba(34, 197, 94, 0.6)', light: '#DCFCE7' }
  }, [clampedScore])

  const getLevelConfig = useMemo(() => {
    const configs = {
      CRITICAL: { label: 'CRITICAL', icon: '⚠', color: '#EF4444' },
      HIGH: { label: 'HIGH RISK', icon: '▲', color: '#F97316' },
      MEDIUM: { label: 'MEDIUM', icon: '●', color: '#F59E0B' },
      LOW: { label: 'LOW RISK', icon: '✓', color: '#22C55E' },
      UNKNOWN: { label: 'UNKNOWN', icon: '?', color: '#64748B' },
    }
    return configs[level as keyof typeof configs] || configs.UNKNOWN
  }, [level])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = size
    const height = size
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const centerX = width / 2
    const centerY = height / 2
    const radius = (width * 0.85) / 2
    const lineWidth = Math.max(6, width * 0.07)
    const startAngle = Math.PI * 0.85
    const endAngle = Math.PI * 2.15
    const totalAngle = endAngle - startAngle

    let frame = 0
    const animateFrame = () => {
      if (animate && currentScoreRef.current < clampedScore) {
        currentScoreRef.current = Math.min(clampedScore, currentScoreRef.current + 2)
      } else if (!animate) {
        currentScoreRef.current = clampedScore
      }

      ctx.clearRect(0, 0, width, height)

      const progress = currentScoreRef.current / 100
      const currentAngle = startAngle + totalAngle * progress

      ctx.shadowBlur = 0

      const bgGradient = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      )
      bgGradient.addColorStop(0, 'rgba(148, 163, 184, 0.15)')
      bgGradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.08)')
      bgGradient.addColorStop(1, 'rgba(148, 163, 184, 0.15)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false)
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.strokeStyle = bgGradient
      ctx.stroke()

      const segments = [
        { start: 0, end: 0.3, color: '#22C55E' },
        { start: 0.3, end: 0.6, color: '#F59E0B' },
        { start: 0.6, end: 0.8, color: '#F97316' },
        { start: 0.8, end: 1, color: '#EF4444' },
      ]

      segments.forEach(seg => {
        const segStart = startAngle + totalAngle * seg.start
        const segEnd = startAngle + totalAngle * Math.min(seg.end, progress)
        
        if (segEnd > segStart) {
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, segStart, segEnd, false)
          ctx.lineWidth = lineWidth
          ctx.lineCap = 'round'
          
          const grad = ctx.createLinearGradient(
            centerX - radius, centerY - radius,
            centerX + radius, centerY + radius
          )
          grad.addColorStop(0, seg.color)
          grad.addColorStop(1, seg.color + 'CC')
          ctx.strokeStyle = grad
          ctx.stroke()
        }
      })

      if (progress > 0) {
        const needleAngle = currentAngle
        const needleLength = radius * 0.85
        
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(needleAngle)
        
        const needleGrad = ctx.createLinearGradient(0, 0, needleLength, 0)
        needleGrad.addColorStop(0, getColor.main)
        needleGrad.addColorStop(1, getColor.main + '80')
        
        ctx.beginPath()
        ctx.moveTo(-radius * 0.1, 0)
        ctx.lineTo(0, -lineWidth / 2)
        ctx.lineTo(needleLength, 0)
        ctx.lineTo(0, lineWidth / 2)
        ctx.closePath()
        ctx.fillStyle = needleGrad
        ctx.shadowColor = getColor.glow
        ctx.shadowBlur = 10
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(0, 0, lineWidth * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = getColor.main
        ctx.shadowBlur = 0
        ctx.fill()
        
        ctx.restore()
      }

      const centerGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius * 0.4
      )
      centerGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
      centerGrad.addColorStop(1, 'rgba(255,255,255,0.3)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.38, 0, Math.PI * 2)
      ctx.fillStyle = centerGrad
      ctx.fill()

      frame++
      if (animate || currentScoreRef.current < clampedScore) {
        animationRef.current = requestAnimationFrame(animateFrame)
      }
    }

    animateFrame()
    return () => cancelAnimationFrame(animationRef.current)
  }, [clampedScore, size, animate, getColor.main, getColor.glow, level])

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <canvas ref={canvasRef} className="block" aria-hidden="true" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className="text-center"
            animate={animate ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold font-display" style={{ color: getColor.main }}>
              {Math.round(currentScoreRef.current)}
            </div>
            <div className="mt-1 text-xs font-mono font-medium" style={{ color: getColor.main }}>
              /100
            </div>
          </motion.div>
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5" style={{ whiteSpace: 'nowrap' }}>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: getLevelConfig.color }}>
            {getLevelConfig.icon} {getLevelConfig.label}
          </span>
        </div>
      </div>

      {showLabel && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Investigative Priority</p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 font-mono">
            {getRiskDescription(clampedScore)}
          </p>
        </motion.div>
      )}
    </div>
  )
}

function getRiskDescription(score: number): string {
  if (score >= 80) return 'Immediate investigation required • High anomaly confidence'
  if (score >= 60) return 'Elevated risk detected • Review recommended'
  if (score >= 30) return 'Moderate risk indicators • Monitor closely'
  return 'Normal transaction patterns • Low priority'
}

interface RiskGaugeCardProps {
  score: number
  level: string
  factors?: Array<{ name: string; value: number; color: string }>
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

export function RiskGaugeCard({ score, level, factors, trend = 'stable', className = "" }: RiskGaugeCardProps) {
  const getColor = (s: number) => {
    if (s >= 80) return { main: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' }
    if (s >= 60) return { main: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' }
    if (s >= 30) return { main: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' }
    return { main: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' }
  }

  const colors = getColor(score)
  const clampedScore = Math.max(0, Math.min(100, score))

  return (
    <motion.div
      className={`relative p-6 rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 8px 32px ${colors.main}20, inset 0 1px 0 rgba(255,255,255,0.4)`,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-purple-500/5" />
      
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-6 min-w-0">
          <RiskGauge score={score} level={level} size={120} showLabel={false} animate />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <span className="px-3 py-1 text-sm font-bold rounded-full text-white" style={{ backgroundColor: colors.main }}>
                {clampedScore}/100
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full text-white" style={{ backgroundColor: colors.main + 'CC' }}>
                {level}
              </span>
            </div>
            
            <div className="h-2 rounded-full overflow-hidden flex-1 max-w-xs" style={{ background: colors.bg }}>
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  width: '0%',
                  background: `linear-gradient(90deg, ${colors.main}, ${colors.main}CC)`,
                  boxShadow: `0 0 10px ${colors.main}`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${clampedScore}%` }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
            
            <div className="flex items-center gap-3 mt-3 text-sm text-surface-600 dark:text-surface-400">
              <span className="flex items-center gap-1">
                {trend === 'up' && <span className="text-danger-500">▲</span>}
                {trend === 'down' && <span className="text-success-500">▼</span>}
                {trend === 'stable' && <span className="text-warning-500">■</span>}
                <span className="font-medium">
                  {trend === 'up' ? 'Risk increasing' : trend === 'down' ? 'Risk decreasing' : 'Risk stable'}
                </span>
              </span>
              <span className="text-surface-400 dark:text-surface-500">•</span>
              <span className="font-mono">Updated just now</span>
            </div>
          </div>
        </div>

        {factors && factors.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2 min-w-[200px]">
            {factors.map((factor, idx) => (
              <motion.div
                key={factor.name}
                className="flex items-center gap-3 p-3 rounded-xl flex-1 min-w-0"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                whileHover={{ 
                  x: 4,
                  boxShadow: `0 8px 24px ${colors.main}30`,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: factor.color + '20' }}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: factor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{factor.name}</p>
                  <p className="text-lg font-bold font-mono" style={{ color: factor.color }}>{factor.value.toFixed(1)}%</p>
                </div>
                <motion.div
                  className="w-16 h-2 rounded-full flex-shrink-0 overflow-hidden"
                  style={{ background: colors.bg }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${Math.min(100, factor.value * 10)}%`,
                      background: `linear-gradient(90deg, ${factor.color}, ${factor.color}CC)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, factor.value * 10)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + idx * 0.05 }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.main}, transparent)` }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
      />
    </motion.div>
  )
}

interface PulseRingProps {
  color?: string
  size?: number
  className?: string
}

export function PulseRing({ color = '#06B6D4', size = 60, className = "" }: PulseRingProps) {
  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color, opacity: 0.4 - i * 0.1 }}
          animate={{
            scale: [0.5, 1],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ 
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}20`
      }} />
    </div>
  )
}

export default RiskGauge