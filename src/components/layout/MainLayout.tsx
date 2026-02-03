import { Header } from './Header'
import { Footer } from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout wrapper for public pages
 * Includes Header and Footer
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
