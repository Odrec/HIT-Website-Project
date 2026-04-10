import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db/prisma'
import type { UserRole } from '@/generated/prisma/client/enums'
import authConfig from './auth.config'

/**
 * Extended session + JWT types.
 *
 * Keep session.user.role as required (not optional) so guards can rely on it
 * being present after authentication.
 */
declare module 'next-auth' {
  interface User {
    role: UserRole
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }
}

/**
 * Full Auth.js config. Extends the Edge-compatible base with the Credentials
 * provider, which uses Prisma + bcrypt (Node runtime only).
 *
 * Exports the standard Auth.js v5 surface: `auth`, `handlers`, `signIn`,
 * `signOut`. Use `auth()` in server components and API routes to read the
 * current session.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@zsb-os.de' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email und Passwort sind erforderlich')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Ungültige Anmeldedaten')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Ungültige Anmeldedaten')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
