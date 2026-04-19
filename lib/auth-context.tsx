'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from './types'
import { users } from './dummy-data'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize user from sessionStorage on mount
  useEffect(() => {
    const email = sessionStorage.getItem('authenticatedUserEmail')
    if (email) {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (foundUser) {
        setUserState(foundUser)
      }
    }
    setIsLoading(false)
  }, [])

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      sessionStorage.setItem('authenticatedUserEmail', newUser.email)
    } else {
      sessionStorage.removeItem('authenticatedUserEmail')
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
