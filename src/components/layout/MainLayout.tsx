import { connection } from 'next/server'
import { Header } from './Header'
import { Footer } from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * The "Start" menu entry leads back to the ZSB's HIT page, because the HIT
 * programme site is embedded there. Server-only env, read at request time
 * (same pattern as CONTACT_EMAIL in Footer) — no image rebuild needed.
 */
export const DEFAULT_START_URL = 'https://www.zsb-os.de/hit'

/**
 * Main layout wrapper for public pages: Header and Footer.
 *
 * `connection()` makes every public page render per request. Without it Next
 * prerenders the static ones (/events, /schedule, /impressum, …) at build time,
 * and START_URL / CONTACT_EMAIL would be frozen to whatever the build saw.
 */
export async function MainLayout({ children }: MainLayoutProps) {
  await connection()
  const startHref = process.env.START_URL || DEFAULT_START_URL
  return (
    <div className="flex min-h-screen flex-col">
      <Header startHref={startHref} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
