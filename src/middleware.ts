import NextAuth from 'next-auth'
import authConfig from './auth.config'

/**
 * Edge middleware. Uses the Edge-compatible auth config (no Prisma/bcrypt)
 * and delegates route protection to the `authorized` callback in auth.config.
 */
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (folder assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
