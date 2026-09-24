import { useEffect, useMemo, useState, useRef } from "react"
import { motion } from "framer-motion"
import { MoveRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ["Offline", "Secure", "Intelligent", "Private", "Reliable"],
    []
  )

  const dashboardRef = useRef(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  const scrollToDashboard = () => {
    const dashboard = document.getElementById('investigation-dashboard')
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {/* Base gradient - Light mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50" style={{ backgroundColor: '#EAF2FA' }} />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #06B6D4 0%, #0891AE 50%, transparent 70%)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-1/5 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
            style={{ background: "radial-gradient(circle, #0ea5e9 0%, #3b82f6 50%, transparent 70%)" }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #22c55e 0%, #16a34a 50%, transparent 70%)" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute bottom-1/5 right-1/4 w-[550px] h-[550px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #f59e0b 0%, #f97316 50%, transparent 70%)" }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0px 0px', '80px 80px', '0px 0px']
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: `
                linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        {/* Floating particles */}
        <ParticleField count={30} />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/10 via-transparent to-surface-900/10 pointer-events-none" />

        {/* Scanline effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(23,32,51,0.04) 2px, rgba(23,32,51,0.04) 4px)'
        }} />
      </div>

      {/* Foreground Content */}
      <div className="container-page relative z-10">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-brand-500">This is something</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-surface-500 dark:text-surface-400 max-w-2xl text-center">
              Analyze Bitcoin transactions offline with AI-powered anomaly detection,
              risk scoring, and graph visualization. Built for air-gapped environments.
            </p>
          </div>
          <div className="flex flex-row gap-3 justify-center">
            <motion.button
              ref={dashboardRef}
              onClick={scrollToDashboard}
              className="relative overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-brand-700 dark:text-brand-200
                bg-surface-100/60 dark:bg-surface-900/60 backdrop-blur-xl border border-brand-300/30 dark:border-brand-600/30
                shadow-[0_8px_32px_rgba(6,182,212,0.15)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.25)]
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-surface-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ 
                scale: 1.02, 
                y: -2,
                boxShadow: '0 16px 48px rgba(6,182,212,0.3)',
                borderColor: 'rgba(6, 182, 212, 0.6)',
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98, 
                y: 0,
                boxShadow: '0 4px 16px rgba(6,182,212,0.2)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="relative flex items-center gap-3 z-10">
                Get Started
                <MoveRight className="w-5 h-5 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/10 to-brand-400/20"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1, duration: 0.7, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ParticleField({ count = 30 }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
  , [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(14, 165, 233, ${p.opacity}) 0%, rgba(168, 85, 247, ${p.opacity * 0.5}) 50%, transparent 70%)`,
            filter: 'blur(1px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [p.opacity, p.opacity * 0.3, p.opacity],
            scale: [1, 1.5, 1],
            y: [0, -100, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

export { Hero }