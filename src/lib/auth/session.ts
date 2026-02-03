import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-options'
import type { UserRole } from '@prisma/client'

/**
 * Get the current server-side session
 * Use this in Server Components and API routes
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser()
  return user ? roles.includes(user.role) : false
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN' as UserRole)
}

/**
 * Check if the current user is an admin or organizer
 */
export async function isAdminOrOrganizer(): Promise<boolean> {
  return hasAnyRole(['ADMIN', 'ORGANIZER'] as UserRole[])
}
