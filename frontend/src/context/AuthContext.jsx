import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE = 'http://localhost:3001/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const stored = localStorage.getItem('txguard_session')
      if (stored) {
        const session = JSON.parse(stored)
        if (session.expiresAt > Date.now()) {
          setUser(session.user)
          setToken(session.token)
          setIsLoading(false)
          return
        }
        localStorage.removeItem('txguard_session')
      }
    } catch {
      localStorage.removeItem('txguard_session')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    const session = {
      user: data.user,
      token: data.token,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000
    }

    localStorage.setItem('txguard_session', JSON.stringify(session))
    setUser(data.user)
    setToken(data.token)
  }

  const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'analyst' })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    const session = {
      user: data.user,
      token: data.token,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000
    }

    localStorage.setItem('txguard_session', JSON.stringify(session))
    setUser(data.user)
    setToken(data.token)
  }

  const logout = () => {
    localStorage.removeItem('txguard_session')
    setUser(null)
    setToken(null)
  }

  const refreshSession = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const session = {
          user: data.user,
          token: data.token,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000
        }
        localStorage.setItem('txguard_session', JSON.stringify(session))
        setToken(data.token)
      }
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}