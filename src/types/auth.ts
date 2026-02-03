// Authentication and authorization types

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  PUBLIC = 'PUBLIC',
}

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: User
  expires: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name?: string
  role?: UserRole
}

// Permission types for RBAC
export type Permission =
  | 'events:read'
  | 'events:create'
  | 'events:update'
  | 'events:delete'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'schedules:read'
  | 'schedules:create'
  | 'schedules:update'
  | 'schedules:delete'
  | 'admin:access'

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
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
  ],
  [UserRole.ORGANIZER]: [
    'events:read',
    'events:create',
    'events:update',
    'schedules:read',
  ],
  [UserRole.PUBLIC]: [
    'events:read',
    'schedules:read',
    'schedules:create',
    'schedules:update',
    'schedules:delete',
  ],
}
