"use client"

import { useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AdvancedBackground({ className = "", children, variant = "default" }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particles = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.05,
      color: Math.random() > 0.5 ? '#06B6D4' : '#a855f7',
      connections: [],
    }))
  , [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let mouseX = -1000
    let mouseY = -1000

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', resize)
    resize()

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > 100) p.vx *= -1
        if (p.y < 0 || p.y > 100) p.vy *= -1

        p.x = Math.max(0, Math.min(100, p.x))
        p.y = Math.max(0, Math.min(100, p.y))

        const px = (p.x / 100) * width
        const py = (p.y / 100) * height
        const r = Math.max(1, p.radius * (width / 1920))

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, r * 3)
        gradient.addColorStop(0, `${p.color}${Math.round(p.opacity * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${p.color}00`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(px, py, r * 3, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy) * Math.max(width, height) / 100
          
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.15
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo((particles[i].x / 100) * width, (particles[i].y / 100) * height)
            ctx.lineTo((particles[j].x / 100) * width, (particles[j].y / 100) * height)
            ctx.stroke()
          }
        }
      }

      particles.forEach(p => {
        const dx = (p.x / 100) * width - mouseX
        const dy = (p.y / 100) * height - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 200) {
          const force = (1 - dist / 200) * 0.3
          p.vx += (dx / dist) * force * 0.01
          p.vy += (dy / dist) * force * 0.01
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      cancelAnimationFrame(animationRef.current)
      canvas.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [particles])

  const variants = {
    default: {
      gradient: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168,85,247,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 60% at 10% 80%, rgba(34,197,94,0.08) 0%, transparent 50%)",
      overlay: "linear-gradient(180deg, rgba(234,242,250,0) 0%, rgba(14,165,233,0.02) 50%, rgba(234,242,250,0) 100%)"
    },
    dark: {
      gradient: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.2) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168,85,247,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 60% at 10% 80%, rgba(34,197,94,0.12) 0%, transparent 50%)",
      overlay: "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(6,182,212,0.03) 50%, rgba(15,23,42,0) 100%)"
    },
    intense: {
      gradient: "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(6,182,212,0.25) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 100% 0%, rgba(168,85,247,0.2) 0%, transparent 50%), radial-gradient(ellipse 70% 80% at 0% 100%, rgba(34,197,94,0.18) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(245,158,11,0.15) 0%, transparent 50%)",
      overlay: "linear-gradient(45deg, rgba(6,182,212,0.03) 0%, transparent 50%, rgba(168,85,247,0.03) 100%)"
    }
  }

  const v = variants[variant]

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ minHeight: '100vh' }}>
      <div className="absolute inset-0 -z-10" style={{ background: v.gradient }} />
      
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 -z-10 opacity-60"
        style={{ touchAction: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      <div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: v.overlay }} />
      
      <div className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)'
      }} />

      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}

export function GlowOrb({ x = "50%", y = "50%", size = "400px", color = "#06B6D4", opacity = 0.3, blur = "80px", animation = true, className = "" }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur})`,
        opacity,
      }}
      animate={animation ? {
        scale: [1, 1.15, 1],
        opacity: [opacity, opacity * 1.5, opacity],
      } : {}}
      transition={animation ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : {}}
    />
  )
}

export function GridPattern({ size = 80, color = "rgba(14, 165, 233, 0.06)", animated = true, className = "" }) {
  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
      animate={animated ? { backgroundPosition: ['0px 0px', `${size}px ${size}px`, '0px 0px'] } : {}}
      transition={animated ? { duration: 20, repeat: Infinity, ease: "linear" } : {}}
    />
  )
}

export function Scanlines({ opacity = 0.03, className = "" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{
      opacity,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)'
    }} />
  )
}

export function Vignette({ className = "", intensity = "medium" }) {
  const intensities = {
    subtle: "radial-gradient(ellipse at center, transparent 60%, rgba(15,23,42,0.15) 100%)",
    medium: "radial-gradient(ellipse at center, transparent 40%, rgba(15,23,42,0.25) 100%)",
    strong: "radial-gradient(ellipse at center, transparent 20%, rgba(15,23,42,0.4) 100%)",
  }
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{
      background: intensities[intensity]
    }} />
  )
}

export function NoiseTexture({ opacity = 0.02, className = "" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{
      opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }} />
  )
}

export default AdvancedBackground