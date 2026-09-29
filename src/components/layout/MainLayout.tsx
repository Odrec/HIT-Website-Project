import { Header } from './Header'
import { Footer } from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout wrapper for public pages
 * Includes Header and Footer
 */
/**
 * The "Start" menu entry leads back to the ZSB's HIT page, because the HIT
 * programme site is embedded there. Server-only env, read at request time
 * (same pattern as CONTACT_EMAIL in Footer) — no image rebuild needed.
 */
export const DEFAULT_START_URL = 'https://www.zsb-os.de/hit'

export function MainLayout({ children }: MainLayoutProps) {
  const startHref = process.env.START_URL || DEFAULT_START_URL
  return (
    <div className="flex min-h-screen flex-col">
      <Header startHref={startHref} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
