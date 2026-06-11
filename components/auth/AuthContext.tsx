'use client'
import { createContext, useContext } from 'react'

type Auth = { isAdmin: boolean; email: string | null }

const AuthContext = createContext<Auth>({ isAdmin: false, email: null })

export function AuthProvider({ value, children }: { value: Auth; children: React.ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useIsAdmin() {
  return useContext(AuthContext).isAdmin
}
