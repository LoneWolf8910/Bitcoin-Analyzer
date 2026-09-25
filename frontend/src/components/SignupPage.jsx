import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, Unlock, User, Mail, Eye, EyeOff, 
  ChevronLeft, AlertCircle, CheckCircle, 
  Shield, Zap, Brain, Database
} from 'lucide-react'

export function SignupPage({ onLogin, onBackToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // Call AuthContext's register function which handles API + state
      await onLogin(name, email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [name, email, password, confirmPassword, onLogin])

  const handleBackToLogin = useCallback(() => {
    onBackToLogin?.()
  }, [onBackToLogin])

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
        {/* Back to Login Link */}
        <motion.button
          onClick={handleBackToLogin}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6 flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Sign In</span>
        </motion.button>

        {/* Signup Card */}
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
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)" }}>
              <User className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-surface-100">
              Create Account
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-2">
              Join TxGuard Offline Bitcoin Investigation Platform
            </p>
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

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="mb-5 p-3 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 flex items-center gap-3"
                role="status"
              >
                <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
                <p className="text-sm text-success-700 dark:text-success-300">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="input pl-10 pr-4 py-3"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

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
                  placeholder="you@organization.com"
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
                  autoComplete="new-password"
                  required
                  minLength={8}
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
              <p className="mt-1.5 text-xs text-surface-500 dark:text-surface-400">
                Minimum 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="input pl-10 pr-4 py-3"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 mt-0.5 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="terms" className="text-sm text-surface-600 dark:text-surface-400">
                I agree to the{' '}
                <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>
              </label>
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
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  Create Account
                </span>
              )}
            </motion.button>
          </form>

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

        {/* Demo Notice */}
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
            Quick Demo Access
          </summary>
          <div className="mt-3 space-y-2 text-xs">
            <p className="text-surface-600 dark:text-surface-400">
              For immediate access, use one of the demo accounts on the <a href="#" onClick={handleBackToLogin} className="text-brand-600 dark:text-brand-400 hover:underline">Sign In page</a>:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { email: 'admin@txguard.demo', pass: 'txguard2024', role: 'Admin' },
                { email: 'analyst@txguard.demo', pass: 'analyst2024', role: 'Analyst' },
                { email: 'viewer@txguard.demo', pass: 'viewer2024', role: 'Viewer' },
                { email: 'demo@txguard.local', pass: 'demo1234', role: 'Demo' }
              ].map((acc) => (
                <div key={acc.email} className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-surface-600 dark:text-surface-400">{acc.email}</span>
                  <br />
                  <span className="text-surface-500 dark:text-surface-500 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">{acc.pass}</span>
                  <span className="text-surface-400 dark:text-surface-500 ml-1">({acc.role})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.details>
      </motion.div>
    </motion.div>
  )
}

export default SignupPage