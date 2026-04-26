'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from './api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'annotator' | 'reviewer' | 'admin'
  department?: string
  badges?: Array<{ type: string; name: string; description: string; awardedAt: string }>
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

const CACHE_KEY = 'lf_user'

function readCache(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCache(u: AuthUser | null) {
  try {
    if (u) sessionStorage.setItem(CACHE_KEY, JSON.stringify(u))
    else sessionStorage.removeItem(CACHE_KEY)
  } catch {}
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Immediately hydrate from cache so the UI renders with user data before the API responds
    const cached = readCache()
    if (cached) {
      setUserState(cached)
      setIsLoading(false)
    }

    // Verify with the server in the background
    api.auth.me()
      .then(u => {
        setUserState(u)
        writeCache(u)
      })
      .catch(() => {
        // Only clear if we had no cache — if we have a cached user and the network
        // call fails (e.g. offline), don't nuke the UI; the cookie check in middleware
        // already protects routes server-side
        if (!cached) {
          setUserState(null)
          writeCache(null)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const setUser = (newUser: AuthUser | null) => {
    setUserState(newUser)
    writeCache(newUser)
  }

  const logout = async () => {
    await api.auth.logout().catch(() => {})
    writeCache(null)
    setUserState(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
