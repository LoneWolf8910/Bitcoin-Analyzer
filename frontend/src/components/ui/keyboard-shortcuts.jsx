"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Keyboard, Key, Zap, Shield, Search, 
  RefreshCw, Download, Copy, ExternalLink, 
  ChevronRight, ChevronLeft, Home, End, 
  X, Command, HelpCircle, Info, AlertTriangle,
  CheckCircle, Minus, Layers, GitBranch, 
  BarChart2, Activity, History, Target
} from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
  category: string
  icon?: React.ReactNode
  action?: () => void
}

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
  onAction?: (action: string) => void
}

const SHORTCUT_CATEGORIES = [
  {
    id: 'navigation',
    label: 'Navigation',
    icon: <Activity className="w-4 h-4" />,
    shortcuts: [
      { keys: ['1'], description: 'Overview Tab' },
      { keys: ['2'], description: 'Transactions Tab' },
      { keys: ['3'], description: 'Graph Tab' },
      { keys: ['4'], description: 'Risk Analysis Tab' },
      { keys: ['5'], description: 'Statistics Tab' },
    ] as Shortcut[]
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: <Zap className="w-4 h-4" />,
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'New Investigation' },
      { keys: ['⌘', 'R'], description: 'Refresh Data' },
      { keys: ['⌘', 'E'], description: 'Export Investigation' },
      { keys: ['⌘', 'C'], description: 'Copy Wallet Address' },
      { keys: ['⌘', 'O'], description: 'View on Explorer' },
    ] as Shortcut[]
  },
  {
    id: 'search',
    label: 'Search & Command',
    icon: <Search className="w-4 h-4" />,
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open Command Palette' },
      { keys: ['⌘', '⇧', 'K'], description: 'Focus Search Input' },
      { keys: ['Esc'], description: 'Close Modal / Blur Search' },
      { keys: ['?'], description: 'Show This Help' },
    ] as Shortcut[]
  },
  {
    id: 'graph',
    label: 'Graph Controls',
    icon: <GitBranch className="w-4 h-4" />,
    shortcuts: [
      { keys: ['G'], description: 'Toggle 2D/3D View' },
      { keys: ['F'], description: 'Fit Graph to View' },
      { keys: ['L'], description: 'Toggle Labels' },
      { keys: ['E'], description: 'Toggle Edges' },
      { keys: ['⌘', '+'], description: 'Zoom In' },
      { keys: ['⌘', '-'], description: 'Zoom Out' },
      { keys: ['⌘', '0'], description: 'Reset Zoom' },
    ] as Shortcut[]
  },
  {
    id: 'view',
    label: 'View Options',
    icon: <Layers className="w-4 h-4" />,
    shortcuts: [
      { keys: ['⌘', '⇧', 'T'], description: 'Toggle Theme' },
      { keys: ['⌘', '⇧', 'F'], description: 'Fullscreen' },
      { keys: ['⌘', '⇧', 'S'], description: 'Screenshot Graph' },
    ] as Shortcut[]
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: <Shield className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Tab'], description: 'Next Focusable Element' },
      { keys: ['⇧', 'Tab'], description: 'Previous Focusable Element' },
      { keys: ['←', '→'], description: 'Switch Tabs (when focused)' },
      { keys: ['Home'], description: 'First Tab' },
      { keys: ['End'], description: 'Last Tab' },
      { keys: ['Space', 'Enter'], description: 'Activate Button/Link' },
    ] as Shortcut[]
  }
]

export function KeyboardShortcuts({ isOpen, onClose, onAction }: KeyboardShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const allShortcuts = useMemo(() => 
    SHORTCUT_CATEGORIES.flatMap(cat => 
      cat.shortcuts.map(s => ({ ...s, category: cat.label, categoryIcon: cat.icon }))
    ), [])

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return allShortcuts
    const query = searchQuery.toLowerCase()
    return allShortcuts.filter(s => 
      s.description.toLowerCase().includes(query) ||
      s.keys.some(k => k.toLowerCase().includes(query)) ||
      s.category.toLowerCase().includes(query)
    )
  }, [allShortcuts, searchQuery])

  const groupedShortcuts = useMemo(() => {
    return filteredShortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) acc[shortcut.category] = []
      acc[shortcut.category].push(shortcut)
      return acc
    }, {} as Record<string, Shortcut[]>)
  }, [filteredShortcuts])

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === '?' && e.target === document.body) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onKeyDown={handleKeyPress}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        <motion.div
          ref={containerRef}
          className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 25px 80px rgba(15,23,42,0.2), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
            borderRadius: '24px',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-purple-500/5 rounded-2xl" />
          
          <div className="relative p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #06B6D4 0%, #a855f7 100%)',
                    boxShadow: '0 8px 32px rgba(6,182,212,0.3)'
                  }}
                  animate={{ rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Keyboard className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    id="shortcuts-title"
                    className="text-2xl font-bold font-display text-surface-900 dark:text-surface-100 bg-clip-text text-transparent bg-gradient-to-r from-surface-900 via-brand-600 to-purple-600 dark:from-surface-100 dark:via-brand-400 dark:to-purple-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    Keyboard Shortcuts
                  </motion.h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {filteredShortcuts.length} shortcuts {searchQuery ? `matching "${searchQuery}"` : 'available'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter shortcuts..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-100/60 dark:bg-surface-800/60 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 rounded-xl text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50"
                    onKeyDown={handleKeyPress}
                  />
                  {searchQuery && (
                    <motion.button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
                
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-surface-100/60 dark:bg-surface-800/60 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close shortcuts"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts], catIdx) => (
                <motion.div
                  key={category}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + catIdx * 0.05, duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(168,85,247,0.1) 100%)' }}>
                      {SHORTCUT_CATEGORIES.find(c => c.label === category)?.icon}
                    </div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">{category}</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-brand-500/30 to-transparent" />
                    <span className="text-xs font-mono text-surface-400 dark:text-surface-500 px-2 py-0.5 rounded bg-surface-100/50 dark:bg-surface-800/50">
                      {shortcuts.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-11">
                    {shortcuts.map((shortcut, idx) => (
                      <motion.div
                        key={`${category}-${idx}`}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl group transition-all duration-200"
                        style={{ 
                          background: 'rgba(255,255,255,0.4)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                        whileHover={{ 
                          x: 8,
                          background: 'rgba(6,182,212,0.08)',
                          borderColor: 'rgba(6,182,212,0.3)',
                          boxShadow: '0 4px 20px rgba(6,182,212,0.1)'
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.02, duration: 0.2 }}
                      >
                        <div className="flex items-center gap-1.5 min-w-[180px]">
                          {shortcut.keys.map((key, kIdx) => (
                            <motion.kbd
                              key={kIdx}
                              className="px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-200"
                              style={{
                                background: 'rgba(255,255,255,0.8)',
                                backdropFilter: 'blur(10px)',
                                borderColor: 'rgba(148,163,184,0.3)',
                                color: '#1e293b',
                                boxShadow: '0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.5)'
                              }}
                              whileHover={{ 
                                scale: 1.05,
                                y: -1,
                                boxShadow: '0 4px 16px rgba(6,182,212,0.2)',
                                borderColor: '#06B6D4'
                              }}
                            >
                              {key}
                            </motion.kbd>
                          ))}
                        </div>
                        <div className="flex-1 text-surface-700 dark:text-surface-300 font-medium">
                          {shortcut.description}
                        </div>
                        <ChevronRight className="w-5 h-5 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
              
              {filteredShortcuts.length === 0 && searchQuery && (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(249,115,22,0.1) 100%)' }}>
                    <Search className="w-8 h-8 text-warning-500" />
                  </div>
                  <p className="text-surface-600 dark:text-surface-400">No shortcuts found for "<span className="font-mono text-surface-900 dark:text-surface-100">{searchQuery}</span>"</p>
                  <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Try a different search term</p>
                </motion.div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-surface-200/50 dark:border-surface-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                <span className="font-medium text-surface-700 dark:text-surface-300">Pro Tips:</span>
                <span>Press <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/50 dark:border-surface-700/50">⌘K</kbd> anywhere to open Command Palette</span>
                <span className="hidden sm:inline">|</span>
                <span>Use <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/50 dark:border-surface-700/50">?</kbd> to toggle this help</span>
                <span className="hidden sm:inline">|</span>
                <span>Type wallet address directly in search</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-surface-500 font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/50 dark:border-surface-700/50">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function KeyboardShortcutsHint({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 text-xs font-medium text-surface-500 dark:text-surface-400 bg-surface-100/80 dark:bg-surface-800/80 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 rounded-lg hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
      whileHover={{ 
        scale: 1.05,
        y: -2,
        boxShadow: '0 8px 24px rgba(6,182,212,0.15)',
        borderColor: 'rgba(6,182,212,0.3)',
        textColor: '#06B6D4'
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="w-4 h-4" />
      <span className="hidden sm:inline">Shortcuts</span>
      <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">
        ?
      </kbd>
    </motion.button>
  )
}

export default KeyboardShortcuts