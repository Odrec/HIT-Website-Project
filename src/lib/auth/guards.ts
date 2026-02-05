import { redirect } from 'next/navigation'
import { getSession, getCurrentUser } from './session'
import { hasPermission, canAccessAdmin, type UserRole, type Permission } from './rbac'

/**
 * Server-side route guards for protecting pages
 * Use these in Server Components
 */

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(callbackUrl?: string) {
  const user = await getCurrentUser()

  if (!user) {
    const redirectUrl = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login'
    redirect(redirectUrl)
  }

  return user
}

/**
 * Require a specific role - redirects if user doesn't have the role
 */
export async function requireRole(role: UserRole, callbackUrl?: string) {
  const user = await requireAuth(callbackUrl)

  if (user.role !== role) {
    redirect('/unauthorized')
  }

  return user
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: UserRole[], callbackUrl?: string) {
  const user = await requireAuth(callbackUrl)

  if (!roles.includes(user.role as UserRole)) {
    redirect('/unauthorized')
  }

  return user
}

/**
 * Require admin access
 */
export async function requireAdmin() {
  const user = await requireAuth('/admin')

  if (!canAccessAdmin(user.role as UserRole)) {
    redirect('/unauthorized')
  }

  return user
}

/**
 * Require a specific permission
 */
export async function requirePermission(permission: Permission, callbackUrl?: string) {
  const user = await requireAuth(callbackUrl)

  if (!hasPermission(user.role as UserRole, permission)) {
    redirect('/unauthorized')
  }

  return user
}

/**
 * Check if user has permission without redirecting
 * Useful for conditional rendering
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  return hasPermission(user.role as UserRole, permission)
}

/**
 * Check if user can access admin without redirecting
 */
export async function checkAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  return canAccessAdmin(user.role as UserRole)
}
