"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Command, Key, Zap, Shield, Database, 
  GitBranch, BarChart2, Settings, HelpCircle, 
  ExternalLink, Download, RefreshCw, Eye, 
  Filter, ChevronRight, X, Loader2, 
  Wallet, Activity, AlertTriangle, Copy, 
  History, TrendingUp, Layers
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  category: string
  action: () => void
  keywords: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onInvestigate: (address: string) => void
  onNewSearch: () => void
  onExport: () => void
  onRefresh: () => void
  onToggleTheme: () => void
  onToggleGraphView: () => void
  walletAddress?: string
  hasData: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
  theme: 'light' | 'dark'
  isLoading: boolean
}

export function CommandPalette({ 
  isOpen, 
  onClose, 
  onInvestigate, 
  onNewSearch, 
  onExport, 
  onRefresh, 
  onToggleTheme, 
  onToggleGraphView,
  walletAddress,
  hasData,
  activeTab,
  setActiveTab,
  theme,
  isLoading
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo((): CommandItem[] => {
    const baseCommands: CommandItem[] = [
      {
        id: 'new-search',
        label: 'New Investigation',
        description: 'Start analyzing a new wallet or transaction',
        icon: <Wallet className="w-4 h-4" />,
        shortcut: '⌘ N',
        category: 'Actions',
        action: onNewSearch,
        keywords: ['new', 'investigation', 'search', 'wallet', 'start']
      },
      {
        id: 'refresh',
        label: 'Refresh Data',
        description: 'Reload current investigation with latest data',
        icon: <RefreshCw className="w-4 h-4" />,
        shortcut: '⌘ R',
        category: 'Actions',
        action: onRefresh,
        keywords: ['refresh', 'reload', 'update', 'latest']
      },
      {
        id: 'export',
        label: 'Export Investigation',
        description: 'Download complete analysis as JSON',
        icon: <Download className="w-4 h-4" />,
        shortcut: '⌘ E',
        category: 'Actions',
        action: onExport,
        keywords: ['export', 'download', 'json', 'save', 'report']
      },
      {
        id: 'toggle-theme',
        label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
        description: 'Toggle between light and dark themes',
        icon: theme === 'light' ? <Settings className="w-4 h-4" /> : <Settings className="w-4 h-4" />,
        shortcut: '⌘ ⇧ T',
        category: 'View',
        action: onToggleTheme,
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance']
      },
      {
        id: 'toggle-graph',
        label: 'Toggle Graph View',
        description: 'Switch between 2D and 3D graph visualization',
        icon: <Layers className="w-4 h-4" />,
        shortcut: 'G',
        category: 'View',
        action: onToggleGraphView,
        keywords: ['graph', '3d', '2d', 'visualization', 'view']
      },
      {
        id: 'keyboard-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'Show all available keyboard shortcuts',
        icon: <Key className="w-4 h-4" />,
        shortcut: '?',
        category: 'Help',
        action: () => { onClose(); window.dispatchEvent(new CustomEvent('show-shortcuts')) },
        keywords: ['shortcuts', 'keys', 'help', 'keyboard', 'hotkeys']
      },
    ]

    if (hasData) {
      baseCommands.push(
        {
          id: 'overview-tab',
          label: 'Overview Tab',
          description: 'View wallet summary, risk score, and graph preview',
          icon: <Activity className="w-4 h-4" />,
          shortcut: '1',
          category: 'Navigation',
          action: () => setActiveTab('overview'),
          keywords: ['overview', 'summary', 'dashboard', 'home']
        },
        {
          id: 'transactions-tab',
          label: 'Transactions Tab',
          description: 'Browse all transactions with filtering',
          icon: <History className="w-4 h-4" />,
          shortcut: '2',
          category: 'Navigation',
          action: () => setActiveTab('transactions'),
          keywords: ['transactions', 'history', 'txs', 'list']
        },
        {
          id: 'graph-tab',
          label: 'Graph Tab',
          description: 'Explore transaction network visualization',
          icon: <GitBranch className="w-4 h-4" />,
          shortcut: '3',
          category: 'Navigation',
          action: () => setActiveTab('graph'),
          keywords: ['graph', 'network', 'visualization', 'connections']
        },
        {
          id: 'risk-tab',
          label: 'Risk Analysis Tab',
          description: 'Deep dive into risk factors and indicators',
          icon: <AlertTriangle className="w-4 h-4" />,
          shortcut: '4',
          category: 'Navigation',
          action: () => setActiveTab('risk'),
          keywords: ['risk', 'analysis', 'factors', 'indicators', 'score']
        },
        {
          id: 'stats-tab',
          label: 'Statistics Tab',
          description: 'View detailed statistical breakdowns',
          icon: <BarChart2 className="w-4 h-4" />,
          shortcut: '5',
          category: 'Navigation',
          action: () => setActiveTab('stats'),
          keywords: ['stats', 'statistics', 'analytics', 'metrics']
        },
        {
          id: 'copy-address',
          label: 'Copy Wallet Address',
          description: 'Copy current wallet address to clipboard',
          icon: <Copy className="w-4 h-4" />,
          shortcut: '⌘ C',
          category: 'Actions',
          action: () => navigator.clipboard.writeText(walletAddress || ''),
          keywords: ['copy', 'address', 'clipboard', 'wallet']
        },
        {
          id: 'view-explorer',
          label: 'View on Explorer',
          description: 'Open wallet in mempool.space',
          icon: <ExternalLink className="w-4 h-4" />,
          shortcut: '⌘ O',
          category: 'Actions',
          action: () => window.open(`https://mempool.space/address/${walletAddress}`, '_blank'),
          keywords: ['explorer', 'mempool', 'external', 'view', 'blockchain']
        }
      )
    }

    return baseCommands
  }, [hasData, walletAddress, activeTab, theme, onNewSearch, onRefresh, onExport, onToggleTheme, onToggleGraphView, setActiveTab])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = []
        acc[cmd.category].push(cmd)
        return acc
      }, {} as Record<string, CommandItem[]>)
    }

    const lowerQuery = query.toLowerCase()
    const scored = commands.map(cmd => {
      let score = 0
      const searchText = `${cmd.label} ${cmd.description} ${cmd.keywords.join(' ')}`.toLowerCase()
      
      if (cmd.label.toLowerCase().startsWith(lowerQuery)) score += 100
      if (cmd.label.toLowerCase().includes(lowerQuery)) score += 50
      if (cmd.description.toLowerCase().includes(lowerQuery)) score += 20
      if (cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery))) score += 30
      if (cmd.shortcut?.toLowerCase().includes(lowerQuery)) score += 40
      
      return { cmd, score }
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.reduce((acc, { cmd }) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category].push(cmd)
      return acc
    }, {} as Record<string, CommandItem[]>)
  }, [commands, query])

  const flatCommands = useMemo(() => 
    Object.values(filteredCommands).flat(), 
    [filteredCommands]
  )

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action()
          onClose()
        }
      } else if (e.key === 'Tab' && query) {
        e.preventDefault()
        if (flatCommands[selectedIndex]) {
          setQuery(flatCommands[selectedIndex].label)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatCommands, selectedIndex, query, onClose])

  useEffect(() => {
    if (listRef.current && flatCommands[selectedIndex]) {
      const element = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, flatCommands])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length >= 2) {
      onInvestigate(trimmed)
      onClose()
      setQuery('')
    } else if (flatCommands[selectedIndex]) {
      flatCommands[selectedIndex].action()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        <motion.div
          className="relative w-full max-w-2xl mx-4"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/10 via-transparent to-purple-500/10 blur-2xl opacity-50" />
            
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-surface-400 dark:text-surface-500 pointer-events-none">
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </motion.svg>
                  <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">
                    ⌘K
                  </kbd>
                </div>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or wallet address..."
                  className="w-full pl-20 pr-12 py-4 text-base bg-surface-100/80 dark:bg-surface-900/80 backdrop-blur-2xl border border-surface-200/50 dark:border-surface-700/50 rounded-2xl text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent"
                  autoComplete="off"
                  spellCheck={false}
                  data-search-input="true"
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="text-xs font-mono px-2 py-1 rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50 text-surface-500 dark:text-surface-400">
                    ↵
                  </kbd>
                  <kbd className="text-xs font-mono px-2 py-1 rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50 text-surface-500 dark:text-surface-400 hidden sm:block">
                    Esc
                  </kbd>
                </div>
              </div>
            </form>

            <AnimatePresence mode="wait">
              {(query || Object.keys(filteredCommands).length > 0) && (
                <motion.div
                  className="mt-3 max-h-[500px] overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    ref={listRef}
                    className="bg-surface-100/60 dark:bg-surface-900/60 backdrop-blur-2xl border border-surface-200/50 dark:border-surface-700/50 rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                  >
                    {Object.entries(filteredCommands).map(([category, cmds]) => (
                      <div key={category}>
                        <div className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider border-b border-surface-200/50 dark:border-surface-700/50 bg-surface-50/50 dark:bg-surface-800/50">
                          {category}
                        </div>
                        <ul role="listbox">
                          {cmds.map((cmd, idx) => {
                            const globalIndex = flatCommands.indexOf(cmd)
                            const isSelected = globalIndex === selectedIndex
                            return (
                              <motion.li
                                key={cmd.id}
                                data-index={globalIndex}
                                role="option"
                                aria-selected={isSelected}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${isSelected ? 'bg-brand-50/50 dark:bg-brand-900/20' : 'hover:bg-surface-50/50 dark:hover:bg-surface-800/50'}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.02 }}
                                whileHover={{ x: 4 }}
                              >
                                <motion.div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ 
                                    background: isSelected 
                                      ? 'linear-gradient(135deg, #06B6D4 0%, #a855f7 100%)' 
                                      : 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(168,85,247,0.05) 100%)' 
                                  }}
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                  {cmd.icon}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium truncate ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-surface-900 dark:text-surface-100'}`}>
                                      {cmd.label}
                                    </span>
                                    {cmd.shortcut && (
                                      <kbd className="ml-auto text-xs font-mono px-2 py-0.5 rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50 text-surface-500 dark:text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {cmd.shortcut}
                                      </kbd>
                                    )}
                                  </div>
                                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">{cmd.description}</p>
                                </div>
                                <motion.div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: isSelected ? '#06B6D4' : 'transparent' }}
                                  animate={{ scale: isSelected ? 1 : 0 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                />
                              </motion.li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                    
                    {query && flatCommands.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <motion.div
                          className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(249,115,22,0.1) 100%)' }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Search className="w-6 h-6 text-warning-500" />
                        </motion.div>
                        <p className="text-surface-600 dark:text-surface-400">No commands found for "{query}"</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Try a wallet address or transaction ID</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 px-1 py-2 flex items-center justify-between text-xs text-surface-400 dark:text-surface-500">
              <div className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-brand-500" />
                <span>Command Palette</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">↓</kbd>
                <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">↵</kbd>
                <kbd className="px-1.5 py-0.5 font-mono rounded bg-surface-200/50 dark:bg-surface-700/50 border border-surface-300/50 dark:border-surface-600/50">Esc</kbd>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CommandPalette