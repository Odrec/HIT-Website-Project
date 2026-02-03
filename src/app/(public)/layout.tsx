'use client'

import { MainLayout } from '@/components/layout'

interface PublicLayoutProps {
  children: React.ReactNode
}

/**
 * Public layout wrapper for visitor-facing pages
 * Uses MainLayout with Header and Footer
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return <MainLayout>{children}</MainLayout>
}
