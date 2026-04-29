'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from './api'
import type { UserRole } from './types'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  /** MongoDB ObjectId of the active client workspace */
  tenantId?: string
  /** URL slug of the active client workspace, e.g. "acme-corp" */
  clientSlug?: string
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
    const cached = readCache()
    if (cached) {
      setUserState(cached)
      setIsLoading(false)
    }

    api.auth.me()
      .then(u => {
        setUserState(u)
        writeCache(u)
      })
      .catch(() => {
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
