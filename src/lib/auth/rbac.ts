/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Defines permissions for each user role and provides
 * helper functions for authorization checks.
 */

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'PUBLIC'

export type Permission =
  // Event permissions
  | 'events:read'
  | 'events:create'
  | 'events:update'
  | 'events:delete'
  // User permissions
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Schedule permissions (for user's own schedules)
  | 'schedules:read'
  | 'schedules:create'
  | 'schedules:update'
  | 'schedules:delete'
  // Admin permissions
  | 'admin:access'
  | 'admin:manage-users'
  | 'admin:manage-events'
  | 'admin:view-analytics'

/**
 * Permission definitions for each role
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to all resources
    'events:read',
    'events:create',
    'events:update',
    'events:delete',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
    'admin:access',
    'admin:manage-users',
    'admin:manage-events',
    'admin:view-analytics',
  ],
  ORGANIZER: [
    // Can manage their own events
    'events:read',
    'events:create',
    'events:update',
    'schedules:read',
    'admin:access', // Limited admin access
  ],
  PUBLIC: [
    // Can only read events and manage own schedules
    'events:read',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = RolePermissions[role]
  return permissions.includes(permission)
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return RolePermissions[role] || []
}

/**
 * Check if a role can access admin features
 */
export function canAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, 'admin:access')
}

/**
 * Check if a role can manage events (create, update, delete)
 */
export function canManageEvents(role: UserRole): boolean {
  return hasAnyPermission(role, ['events:create', 'events:update', 'events:delete'])
}

/**
 * Check if a role can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'admin:manage-users')
}
