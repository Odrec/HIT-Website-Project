import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { canAccessAdmin } from '@/lib/auth/rbac'

/**
 * NextAuth.js middleware for protecting routes
 *
 * Protected routes:
 * - /admin/* - Requires ADMIN or ORGANIZER role
 * - /api/admin/* - Requires ADMIN or ORGANIZER role
 */
export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = (request as unknown as { nextauth: { token: { role?: string } | null } }).nextauth
      ?.token

    // Check if accessing admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const userRole = token?.role as 'ADMIN' | 'ORGANIZER' | 'PUBLIC' | undefined

      if (!userRole || !canAccessAdmin(userRole)) {
        // Redirect to login if not authorized
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        loginUrl.searchParams.set('error', 'AccessDenied')
        return NextResponse.redirect(loginUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Only run middleware if user is authenticated
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow public routes
        if (
          pathname === '/' ||
          pathname === '/login' ||
          pathname.startsWith('/events') ||
          pathname.startsWith('/schedule') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/public') ||
          pathname.startsWith('/_next') ||
          pathname.includes('.')
        ) {
          return true
        }

        // Require authentication for admin routes
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
          return !!token
        }

        // Allow everything else
        return true
      },
    },
  }
)

/**
 * Configure which routes should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
