"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  LineChart,
  CreditCard,
  MessageCircle,
  Trophy,
  User,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
]

interface BackendHealth {
  status: string
  offline?: boolean
  trained_at?: string
}

interface GlassNavbarProps {
  backendHealth: BackendHealth | null
  onNavigate?: (itemId: string) => void
}

export function TxGuardLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M16 2C8.268 2 2 7.943 2 12c0 4.477 3.523 8.268 7 10 3.477-1.732 7-5.523 7-10C30 7.943 23.732 2 16 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="-0.5px"
      >
        Tx
      </text>
      <path
        d="M20 14L13.5 20.5L10 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GlassNavbar({ backendHealth, onNavigate }: GlassNavbarProps) {
  const [activeItem, setActiveItem] = useState<string>("home")
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  )
  const navItemsRef = useRef<Record<string, HTMLDivElement>>({})

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isConnected = backendHealth?.status === "ok"

  const handleItemClick = useCallback(
    (itemId: string) => {
      setActiveItem(itemId)
      onNavigate?.(itemId)
    },
    [onNavigate]
  )

  const getItemRect = (itemId: string) => {
    const element = navItemsRef.current[itemId]
    if (!element) return { width: 0, left: 0 }
    return {
      width: element.offsetWidth,
      left: element.offsetLeft,
    }
  }

  const activeRect = getItemRect(activeItem)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(234, 242, 250, 0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(214, 228, 240, 0.7)",
        boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(245, 249, 255, 0.6)",
      }}
      className="pointer-events-auto"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "12px 24px",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* LEFT: Logo / Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 50%, #06B6D4 100%)",
              boxShadow: "0 4px 16px rgba(6, 182, 212, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
            aria-hidden="true"
          >
            <TxGuardLogo />
          </motion.div>
          <div style={{ whiteSpace: "nowrap" }}>
            <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "#172033", fontFamily: "Space Grotesk, system-ui, sans-serif" }}>
              TxGuard
            </h1>
            <p style={{ fontSize: "0.6875rem", color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
              Transaction Guardian
            </p>
          </div>
        </div>

        {/* CENTER: Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 1, minWidth: 0, position: "relative" }}>
          {/* Active indicator capsule */}
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} aria-hidden="true">
            <div
              style={{
                width: activeRect.width,
                height: "36px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.90)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                boxShadow: "0 2px 8px rgba(30, 41, 59, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(255, 255, 255, 0.4)",
              }}
            />
          </div>

          <div
            ref={(el) => (navItemsRef.current[activeItem] = el as HTMLDivElement)}
            style={{ display: "flex", alignItems: "center", gap: "4px", position: "relative", zIndex: 20 }}
          >
            {NAV_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                ref={(el) => {
                  if (el) navItemsRef.current[item.id] = el
                }}
                style={{ display: "flex", alignItems: "center" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-0",
                    activeItem === item.id
                      ? "text-surface-900"
                      : "text-surface-500 hover:text-surface-700"
                  )}
                  aria-current={activeItem === item.id ? "page" : undefined}
                  aria-label={item.label}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" aria-hidden="true" />
                  <AnimatePresence mode="wait">
                    {activeItem === item.id && (
                      <motion.span
                        initial={{ opacity: 0, width: 0, x: -8 }}
                        animate={{ opacity: 1, width: "auto", x: 0 }}
                        exit={{ opacity: 0, width: 0, x: 8 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT: Status indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              color: "#15803d",
            }}
          >
            <motion.span
              style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#22c55e", flexShrink: 0 }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
            <span>{windowWidth < 640 ? "Offline" : "OFFLINE MODE"}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              minWidth: 0,
              background: isConnected
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              border: isConnected
                ? "1px solid rgba(34, 197, 94, 0.25)"
                : "1px solid rgba(239, 68, 68, 0.25)",
              color: isConnected ? "#15803d" : "#b91c1c",
            }}
          >
            <motion.span
              style={{ width: "8px", height: "8px", borderRadius: "9999px", background: isConnected ? "#22c55e" : "#ef4444", flexShrink: 0 }}
              animate={
                isConnected
                  ? { opacity: [1, 0.5, 1] }
                  : { opacity: [1, 0.4, 1] }
              }
              transition={{ duration: isConnected ? 1.5 : 1, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              Backend: {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="sm:hidden">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Glass highlight layer - bottom edge */}
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(234,242,250,0.8), transparent)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.8, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      />

      {/* Subtle radial glow */}
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "100px",
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center top, rgba(6,182,212,0.06) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  )
}

export default GlassNavbar