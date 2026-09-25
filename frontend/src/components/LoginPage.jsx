import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, Unlock, User, Mail, Eye, EyeOff, 
  ChevronLeft, AlertCircle, CheckCircle, 
  Shield, Zap, Brain, Database, LogOut
} from 'lucide-react'

const API_BASE = 'http://localhost:3001/api/auth'

const DEMO_ACCOUNTS = [
  {
    id: 'admin',
    email: 'admin@txguard.demo',
    password: 'txguard2024',
    name: 'Admin Investigator',
    role: 'Administrator',
    badge: 'Full Access',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'analyst',
    email: 'analyst@txguard.demo',
    password: 'analyst2024',
    name: 'Senior Analyst',
    role: 'Compliance Team',
    badge: 'Investigation Access',
    color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
  },
  {
    id: 'viewer',
    email: 'viewer@txguard.demo',
    password: 'viewer2024',
    name: 'Read-Only Viewer',
    role: 'Audit Team',
    badge: 'View Only',
    color: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
  },
  {
    id: 'demo',
    email: 'demo@txguard.local',
    password: 'demo1234',
    name: 'Demo User',
    role: 'Evaluation',
    badge: 'Trial Access',
    color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800'
  }
]

export function LoginPage({ onLogin, onSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showAccountPicker, setShowAccountPicker] = useState(false)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    
    try {
      // Call AuthContext's login function which handles API + state
      await onLogin(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [email, password, onLogin])

  const handleQuickLogin = useCallback((account) => {
    setEmail(account.email)
    setPassword(account.password)
    setSelectedAccount(account)
    setShowAccountPicker(false)
    // Trigger login after state updates
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {}, target: {} })
    }, 0)
  }, [handleSubmit])

  const handleGoToSignup = useCallback(() => {
    onSignup?.()
  }, [onSignup])

  return (
    <motion.div
      className="min-h-screen bg-surface-50 dark:bg-surface-950 relative overflow-hidden flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />
        
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #06B6D4 0%, #0891AE 50%, transparent 70%)" }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #a855f7 0%, #9333ea 50%, transparent 70%)" }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Back to Dashboard Link */}
        <motion.button
          onClick={() => onLogin?.(null)}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6 flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        {/* Login Card */}
        <motion.div
          className="card-elevated p-8"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 100%)" }}>
              <Shield className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-surface-100">
              Sign in to TxGuard
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-2">
              Offline Bitcoin Investigation Platform
            </p>
          </div>

          {/* Demo Account Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              Quick Access (Demo Accounts)
            </label>
            <motion.button
              onClick={() => setShowAccountPicker(!showAccountPicker)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)" }}>
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {selectedAccount ? selectedAccount.name : 'Select a demo account'}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {selectedAccount ? `${selectedAccount.role} • ${selectedAccount.badge}` : 'Click to choose from 4 preset accounts'}
                  </p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-surface-400 transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>

            <AnimatePresence>
              {showAccountPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 space-y-2 max-h-60 overflow-y-auto"
                >
                  {DEMO_ACCOUNTS.map((account) => (
                    <motion.button
                      key={account.id}
                      onClick={() => handleQuickLogin(account)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${account.color.replace('bg-', '').replace('dark:bg-', '').replace('text-', '').replace('border-', '')} 0%, transparent 100%)` }}>
                        <Shield className="w-5 h-5" style={{ color: account.color.match(/text-(\w+)/)?.[1] }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-surface-900 dark:text-surface-100 truncate">{account.name}</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 truncate">{account.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${account.color}`}>
                        {account.badge}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-50/90 dark:bg-surface-950/90 text-surface-400 dark:text-surface-500">
                Or enter credentials manually
              </span>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="mb-5 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 flex items-center gap-3"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0" />
                <p className="text-sm text-danger-700 dark:text-danger-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@txguard.demo"
                  disabled={isLoading}
                  className="input pl-10 pr-4 py-3"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="input pl-10 pr-12 py-3"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-surface-400 hover:text-surface-600" /> : <Eye className="w-5 h-5 text-surface-400 hover:text-surface-600" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
                />
                <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className="w-full btn-primary py-3.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Unlock className="w-5 h-5" />
                  Sign In
                </span>
              )}
            </motion.button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Don't have an account?{' '}
              <button
                onClick={handleGoToSignup}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
              >
                Create one
              </button>
            </p>
          </div>

          {/* Features Hint */}
          <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-500 dark:text-surface-400 text-center mb-4">
              Platform Capabilities
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Air-Gapped', color: 'text-success-600' },
                { icon: Brain, label: 'AI Detection', color: 'text-brand-600' },
                { icon: Database, label: 'Local Data', color: 'text-purple-600' }
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <item.icon className={`w-5 h-5 ${item.color} dark:${item.color.replace('600', '400')}`} />
                  <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Version */}
          <p className="text-center text-xs text-surface-400 dark:text-surface-500 mt-6 font-mono">
            TxGuard v0.1.0 &mdash; Offline Bitcoin Analysis
          </p>
        </motion.div>

        {/* Demo Credentials Reference */}
        <motion.details
          className="mt-6 card p-4"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          <summary className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400 cursor-pointer list-none">
            <Zap className="w-4 h-4 text-warning-500" />
            Demo Credentials Reference
          </summary>
          <div className="mt-3 space-y-2 text-xs font-mono">
            {DEMO_ACCOUNTS.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <span className="text-surface-600 dark:text-surface-400">{acc.email}</span>
                <span className="text-surface-500 dark:text-surface-500 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{acc.password}</span>
              </div>
            ))}
          </div>
        </motion.details>
      </motion.div>
    </motion.div>
  )
}

export default LoginPage