'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Client-side authentication provider
 * Wraps the app to provide session context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
