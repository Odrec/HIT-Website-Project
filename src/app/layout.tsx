import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ScheduleProvider } from '@/contexts/schedule-context'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HIT - Hochschulinformationstag',
  description:
    'Event management and visitor planning system for the Higher Education Information Day at ZSB Osnabrück',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>
          <ScheduleProvider>
            {children}
            <Toaster />
          </ScheduleProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
