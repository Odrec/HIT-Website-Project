import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/generated/prisma/client/enums'
import { canAccessAdmin } from '@/lib/auth/rbac'

/**
 * Edge-compatible Auth.js config.
 *
 * Contains only what the middleware needs: `authorized` callback (to protect
 * routes), JWT session callbacks (to read role from token), and pages. Does
 * NOT import the Credentials provider because `authorize` uses bcrypt + Prisma,
 * which cannot run on the Edge runtime.
 *
 * The full config (see src/auth.ts) extends this with providers.
 */
export default {
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const token = auth?.user

      // Public routes — always allowed
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

      // Admin routes — require role check
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const role = token?.role as UserRole | undefined
        if (!role) {
          // Not authenticated — let Auth.js redirect to signIn with callbackUrl
          return false
        }
        if (!canAccessAdmin(role)) {
          // Authenticated but lacking permission — redirect with explicit error
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('callbackUrl', pathname)
          loginUrl.searchParams.set('error', 'AccessDenied')
          return NextResponse.redirect(loginUrl)
        }
        return true
      }

      // Everything else — allow
      return true
    },
    async jwt({ token, user }) {
      // On initial sign in, copy user fields into the JWT.
      if (user) {
        token.id = user.id as string
        token.email = user.email ?? ''
        token.name = user.name
        token.role = (user as { role: UserRole }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: (token.name as string | null | undefined) ?? null,
          role: token.role as UserRole,
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [], // populated in src/auth.ts
} satisfies NextAuthConfig
