import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hero } from './components/ui/animated-hero'
import { InvestigationDashboard } from './components/InvestigationDashboard'
import { getHealth } from './services/api'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 min-w-0 pt-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center gap-6 text-center px-6"
      >
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 50%, #06B6D4 100%)", boxShadow: "0 8px 32px rgba(6, 182, 212, 0.4)" }}
          animate={{ rotate: [0, 0, 360], boxShadow: ['0 8px 32px rgba(6,182,212,0.4)', '0 12px 48px rgba(6,182,212,0.6)', '0 8px 32px rgba(6,182,212,0.4)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>
        <div className="space-y-3">
          <motion.h2 className="text-2xl font-bold font-display text-surface-900 dark:text-surface-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Investigating Wallet...
          </motion.h2>
          <motion.div className="flex items-center gap-3 text-surface-500 dark:text-surface-400 font-mono text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
            <span>Analyzing transaction patterns</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function App() {
  const [view, setView] = useState('landing')
  const [backendHealth, setBackendHealth] = useState(null)
  const [initialWalletAddress, setInitialWalletAddress] = useState(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await getHealth()
        setBackendHealth(health)
      } catch {
        setBackendHealth({ status: 'error', offline: false })
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const walletParam = params.get('wallet')
    const txParam = params.get('tx')
    
    if (walletParam) {
      setInitialWalletAddress(walletParam)
      setView('dashboard')
    } else if (txParam) {
      setInitialWalletAddress(txParam)
      setView('dashboard')
    }
    setIsLoadingInitial(false)
  }, [])

  const handleStartInvestigation = useCallback((walletAddress) => {
    if (walletAddress) {
      setInitialWalletAddress(walletAddress)
    }
    setView('dashboard')
  }, [])

  const handleBackToLanding = useCallback(() => {
    setView('landing')
    setInitialWalletAddress(null)
    window.history.pushState({}, '', '/')
  }, [])

  if (isLoadingInitial) {
    return <LoadingScreen />
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <motion.div
          key="landing"
          className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 min-w-0 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Hero onStartInvestigation={handleStartInvestigation} />
        </motion.div>
      )}
      {view === 'dashboard' && (
        <motion.div
          key="dashboard"
          className="min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InvestigationDashboard
            initialWalletAddress={initialWalletAddress}
            onBackToLanding={handleBackToLanding}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App