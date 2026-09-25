"use client"

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface TransactionFlowProps {
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: number
    fee: number
    timestamp: number
    direction: 'in' | 'out' | 'self'
    riskScore?: number
  }>
  walletAddress: string
  className?: string
  height?: number
}

export function TransactionFlow({ 
  transactions, 
  walletAddress, 
  className = "", 
  height = 400 
}: TransactionFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const processedTxs = useMemo(() => {
    return transactions
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map((tx, idx) => ({
        ...tx,
        displayIdx: idx,
        normalizedValue: Math.min(1, tx.value / 10),
        riskLevel: tx.riskScore ? 
          (tx.riskScore >= 70 ? 'high' : tx.riskScore >= 40 ? 'medium' : 'low') : 'unknown',
      }))
  }, [transactions])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.parentElement?.clientWidth || 800
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.35
    const minRadius = 60

    let time = 0
    const pulseSpeed = 0.003

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      time += pulseSpeed

      if (processedTxs.length === 0) {
        ctx.save()
        ctx.translate(centerX, centerY)
        
        const pulse = 1 + Math.sin(time * 2) * 0.1
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * pulse)
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)')
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)')
        grad.addColorStop(1, 'transparent')
        
        ctx.beginPath()
        ctx.arc(0, 0, maxRadius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        
        for (let i = 0; i < 3; i++) {
          const r = (maxRadius * 0.3 + i * 30) * (1 + Math.sin(time * 1.5 + i) * 0.05)
          ctx.beginPath()
          ctx.arc(0, 0, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 - i * 0.02})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
        
        ctx.font = '14px system-ui'
        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)'
        ctx.textAlign = 'center'
        ctx.fillText('No transactions to display', 0, 5)
        ctx.restore()
        
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const angleStep = (Math.PI * 2) / processedTxs.length
      const startAngle = -Math.PI / 2

      ctx.save()
      ctx.translate(centerX, centerY)

      for (let ring = 0; ring < 4; ring++) {
        const r = minRadius + (maxRadius - minRadius) * (ring / 3)
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.08 - ring * 0.015})`
        ctx.lineWidth = 1
        ctx.setLineDash([5, 10])
        ctx.stroke()
        ctx.setLineDash([])
      }

      processedTxs.forEach((tx, idx) => {
        const angle = startAngle + idx * angleStep
        const radius = minRadius + (maxRadius - minRadius) * (1 - tx.normalizedValue)
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        const isHovered = hoveredIndex === idx
        const isSelected = selectedIndex === idx
        const pulse = isHovered || isSelected ? 1 + Math.sin(time * 8) * 0.15 : 1

        let color: string
        let glowColor: string
        if (tx.direction === 'in') {
          color = '#22C55E'
          glowColor = 'rgba(34, 197, 94, 0.6)'
        } else if (tx.direction === 'out') {
          color = '#EF4444'
          glowColor = 'rgba(239, 68, 68, 0.6)'
        } else {
          color = '#06B6D4'
          glowColor = 'rgba(6, 182, 212, 0.6)'
        }

        if (tx.riskLevel === 'high') {
          color = '#EF4444'
          glowColor = 'rgba(239, 68, 68, 0.8)'
        } else if (tx.riskLevel === 'medium') {
          color = '#F59E0B'
          glowColor = 'rgba(245, 158, 11, 0.6)'
        }

        const nodeRadius = Math.max(6, 4 + tx.normalizedValue * 10) * pulse
        const lineWidth = Math.max(1, 1 + tx.normalizedValue * 2)

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(x, y)
        const lineGrad = ctx.createLinearGradient(0, 0, x, y)
        lineGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)')
        lineGrad.addColorStop(0.5, `${color}40`)
        lineGrad.addColorStop(1, `${color}60`)
        ctx.strokeStyle = lineGrad
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()

        if (isHovered || isSelected) {
          ctx.beginPath()
          ctx.arc(0, 0, maxRadius * 1.02, angle - 0.02, angle + 0.02)
          ctx.lineTo(Math.cos(angle) * minRadius * 0.8, Math.sin(angle) * minRadius * 0.8)
          ctx.closePath()
          const sectorGrad = ctx.createRadialGradient(0, 0, minRadius * 0.8, 0, 0, maxRadius * 1.02)
          sectorGrad.addColorStop(0, 'transparent')
          sectorGrad.addColorStop(1, `${color}30`)
          ctx.fillStyle = sectorGrad
          ctx.fill()
        }
      })

      processedTxs.forEach((tx, idx) => {
        const angle = startAngle + idx * angleStep
        const radius = minRadius + (maxRadius - minRadius) * (1 - tx.normalizedValue)
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        const isHovered = hoveredIndex === idx
        const isSelected = selectedIndex === idx
        const pulse = isHovered || isSelected ? 1 + Math.sin(time * 8) * 0.15 : 1

        let color: string
        let glowColor: string
        if (tx.direction === 'in') {
          color = '#22C55E'
          glowColor = 'rgba(34, 197, 94, 0.6)'
        } else if (tx.direction === 'out') {
          color = '#EF4444'
          glowColor = 'rgba(239, 68, 68, 0.6)'
        } else {
          color = '#06B6D4'
          glowColor = 'rgba(6, 182, 212, 0.6)'
        }

        if (tx.riskLevel === 'high') {
          color = '#EF4444'
          glowColor = 'rgba(239, 68, 68, 0.8)'
        } else if (tx.riskLevel === 'medium') {
          color = '#F59E0B'
          glowColor = 'rgba(245, 158, 11, 0.6)'
        }

        const nodeRadius = Math.max(6, 4 + tx.normalizedValue * 10) * pulse

        const grad = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 2)
        grad.addColorStop(0, color)
        grad.addColorStop(1, `${color}00`)

        ctx.beginPath()
        ctx.arc(x, y, nodeRadius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.filter = 'blur(4px)'
        ctx.fill()
        ctx.filter = 'none'

        ctx.beginPath()
        ctx.arc(x, y, nodeRadius, 0, Math.PI * 2)
        const nodeGrad = ctx.createRadialGradient(x - nodeRadius * 0.3, y - nodeRadius * 0.3, 0, x, y, nodeRadius)
        nodeGrad.addColorStop(0, '#fff')
        nodeGrad.addColorStop(0.3, color)
        nodeGrad.addColorStop(1, color + 'CC')
        ctx.fillStyle = nodeGrad
        ctx.shadowColor = glowColor
        ctx.shadowBlur = isHovered || isSelected ? 20 : 8
        ctx.fill()
        ctx.shadowBlur = 0

        if (isHovered || isSelected) {
          ctx.beginPath()
          ctx.arc(x, y, nodeRadius * 1.8, 0, Math.PI * 2)
          ctx.strokeStyle = `${color}60`
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.beginPath()
          ctx.arc(x, y, nodeRadius * 2.5, 0, Math.PI * 2)
          ctx.strokeStyle = `${color}30`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, minRadius * 0.6)
      centerGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
      centerGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)')
      centerGrad.addColorStop(1, 'rgba(255,255,255,0.1)')
      
      ctx.beginPath()
      ctx.arc(0, 0, minRadius * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = centerGrad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(0, 0, minRadius * 0.6, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationRef.current)
  }, [processedTxs, height])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || processedTxs.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = (e.clientX - rect.left) * dpr - canvas.width / 2
    const y = (e.clientY - rect.top) * dpr - canvas.height / 2

    const centerX = canvas.width / 2 / dpr
    const centerY = canvas.height / 2 / dpr
    const maxRadius = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.35
    const minRadius = 60
    const angleStep = (Math.PI * 2) / processedTxs.length
    const startAngle = -Math.PI / 2

    let found = false
    processedTxs.forEach((tx, idx) => {
      const angle = startAngle + idx * angleStep
      const radius = minRadius + (maxRadius - minRadius) * (1 - tx.normalizedValue)
      const txX = Math.cos(angle) * radius
      const txY = Math.sin(angle) * radius
      const nodeRadius = Math.max(6, 4 + tx.normalizedValue * 10)
      
      const dist = Math.sqrt(Math.pow(x / dpr - txX, 2) + Math.pow(y / dpr - txY, 2))
      if (dist < nodeRadius * 2) {
        setHoveredIndex(idx)
        found = true
      }
    })
    if (!found) setHoveredIndex(null)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredIndex !== null) {
      setSelectedIndex(selectedIndex === hoveredIndex ? null : hoveredIndex)
    }
  }

  const selectedTx = selectedIndex !== null ? processedTxs[selectedIndex] : null
  const hoveredTx = hoveredIndex !== null ? processedTxs[hoveredIndex] : null
  const displayTx = selectedTx || hoveredTx

  const formatValue = (val: number) => {
    if (val >= 1) return val.toFixed(4) + ' BTC'
    if (val >= 0.001) return (val * 1000).toFixed(2) + ' mBTC'
    return (val * 100000000).toFixed(0) + ' sat'
  }

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString()
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Transaction flow visualization"
        role="img"
      />
      
      <AnimatePresence>
        {displayTx && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 px-4 py-3 min-w-0" style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 12px 40px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
              borderRadius: '16px',
            }}>
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: displayTx.direction === 'in' 
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                    : displayTx.direction === 'out'
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : 'linear-gradient(135deg, #06B6D4 0%, #0891AE 100%)'
                }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
              >
                {displayTx.direction === 'in' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                ) : displayTx.direction === 'out' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5v2.25A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75V7.5m18-9l-4.5 4.5M12 3l4.5 4.5M12 3v13.5" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 19V6l-7 7m14-7H5" /></svg>
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {displayTx.direction === 'in' ? 'Incoming' : displayTx.direction === 'out' ? 'Outgoing' : 'Self-transfer'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ 
                    backgroundColor: displayTx.riskLevel === 'high' ? '#EF4444' : 
                                     displayTx.riskLevel === 'medium' ? '#F59E0B' :
                                     displayTx.riskLevel === 'low' ? '#22C55E' : '#64748B'
                  }}>
                    {displayTx.riskLevel?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400 flex-wrap">
                  <span className="font-mono text-surface-900 dark:text-surface-100">{formatValue(displayTx.value)}</span>
                  <span className="text-surface-500 dark:text-surface-400">Fee: <span className="font-mono">{formatValue(displayTx.fee)}</span></span>
                  <span className="text-surface-500 dark:text-surface-400">{formatTime(displayTx.timestamp)}</span>
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono truncate max-w-[200px]">From: {displayTx.from.slice(0, 12)}...</span>
                  <span className="text-surface-400 dark:text-surface-500">→</span>
                  <span className="font-mono truncate max-w-[200px]">To: {displayTx.to.slice(0, 12)}...</span>
                  <span className="text-surface-400 dark:text-surface-500">•</span>
                  <span className="font-mono">TX: {displayTx.hash.slice(0, 16)}...</span>
                </div>
              </div>
              
              <motion.button
                onClick={() => setSelectedIndex(null)}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100/50 dark:hover:bg-surface-800/50 transition-colors flex-shrink-0"
                whileTap={{ scale: 0.9 }}
                aria-label="Close details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-center gap-2 pointer-events-none">
        {[
          { color: '#22C55E', label: 'Incoming' },
          { color: '#EF4444', label: 'Outgoing' },
          { color: '#06B6D4', label: 'Self-transfer' },
          { color: '#EF4444', label: 'High Risk' },
          { color: '#F59E0B', label: 'Medium Risk' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-auto"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${item.color}40`,
              color: item.color,
              boxShadow: '0 2px 8px rgba(15,23,42,0.08)'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

import { AnimatePresence } from 'framer-motion'

interface FlowMiniMapProps {
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: number
    timestamp: number
    direction: 'in' | 'out' | 'self'
    riskScore?: number
  }>
  viewport?: { x: number; y: number; zoom: number }
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void
  className?: string
  size?: number
}

export function FlowMiniMap({ 
  transactions, 
  viewport, 
  onViewportChange, 
  className = "", 
  size = 180 
}: FlowMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)

  const processedTxs = useMemo(() => 
    transactions.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 100), 
  [transactions])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      const padding = 10
      const mapSize = size - padding * 2

      ctx.fillStyle = 'rgba(15, 23, 42, 0.03)'
      ctx.fillRect(padding, padding, mapSize, mapSize)

      if (processedTxs.length > 0) {
        processedTxs.forEach(tx => {
          const x = padding + Math.random() * mapSize
          const y = padding + Math.random() * mapSize
          const radius = Math.max(2, 1 + (tx.value / 10) * 3)
          
          let color = tx.direction === 'in' ? '#22C55E' : tx.direction === 'out' ? '#EF4444' : '#06B6D4'
          if (tx.riskScore && tx.riskScore >= 70) color = '#EF4444'
          else if (tx.riskScore && tx.riskScore >= 40) color = '#F59E0B'

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = color + '80'
          ctx.fill()
        })
      }

      if (viewport) {
        const vpSize = Math.min(mapSize, mapSize / viewport.zoom)
        const vpX = padding + (viewport.x + mapSize / 2) * (vpSize / mapSize) - vpSize / 2
        const vpY = padding + (viewport.y + mapSize / 2) * (vpSize / mapSize) - vpSize / 2
        
        ctx.strokeStyle = '#06B6D4'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(vpX, vpY, vpSize, vpSize)
        ctx.setLineDash([])
        
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)'
        ctx.fillRect(vpX, vpY, vpSize, vpSize)
      }

      if (hovered) {
        ctx.beginPath()
        ctx.arc(hovered.x, hovered.y, 8, 0, Math.PI * 2)
        ctx.strokeStyle = '#06B6D4'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    draw()
  }, [processedTxs, viewport, size])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setHovered({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseLeave = () => setHovered(null)

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onViewportChange || !viewport) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const padding = 10
    const mapSize = size - padding * 2
    const x = ((e.clientX - rect.left - padding) / mapSize - 0.5) * mapSize * 2
    const y = ((e.clientY - rect.top - padding) / mapSize - 0.5) * mapSize * 2
    
    onViewportChange({ ...viewport, x, y })
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Transaction flow minimap"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148,163,184,0.2)',
          boxShadow: '0 4px 16px rgba(15,23,42,0.08)'
        }}
      />
      <div className="absolute top-2 left-2 right-2 flex justify-end">
        <span className="text-xs font-medium px-2 py-1 rounded bg-surface-100/80 dark:bg-surface-800/80 backdrop-blur text-surface-600 dark:text-surface-400">
          Mini-map
        </span>
      </div>
    </div>
  )
}

export default TransactionFlow