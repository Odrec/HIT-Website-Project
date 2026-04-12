'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut, Settings, AlertTriangle, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/contexts/schedule-context'

/**
 * Main header component with navigation and user menu
 */
export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { state, getConflicts } = useSchedule()

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'ORGANIZER'
  const scheduleCount = state.items.length
  const conflictCount = getConflicts().length

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-[86px] items-center justify-between px-4">
        {/* Institutional Logos */}
        <div className="flex items-center gap-3">
          <a href="https://www.uni-osnabrueck.de" target="_blank" rel="noopener noreferrer">
            <Image
              src="/logos/uos-logo.svg"
              alt="Universität Osnabrück"
              width={120}
              height={40}
              className="h-11 w-auto sm:h-14"
            />
          </a>
          <div className="h-11 w-px bg-hit-gray-200" />
          <a href="https://www.hs-osnabrueck.de" target="_blank" rel="noopener noreferrer">
            <Image
              src="/logos/hs-logo.svg"
              alt="Hochschule Osnabrück"
              width={120}
              height={40}
              className="h-11 w-auto sm:h-14"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500"
          >
            Start
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500"
          >
            Veranstaltungen
          </Link>
          <Link
            href="/schedule"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500 flex items-center gap-1"
          >
            Mein Stundenplan
            {scheduleCount > 0 && (
              <div className="ml-1 flex items-center gap-1">
                <Badge
                  variant="default"
                  className="text-xs h-5 min-w-5 flex items-center justify-center bg-hit-uni-500"
                >
                  {scheduleCount}
                </Badge>
                {conflictCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-xs h-5 min-w-5 flex items-center justify-center gap-0.5"
                    title={`${conflictCount} Zeitkonflikt${conflictCount > 1 ? 'e' : ''}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {conflictCount}
                  </Badge>
                )}
              </div>
            )}
          </Link>
          <Link
            href="/route-planner"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500"
          >
            Routenplanung
          </Link>
          <Link
            href="/navigator"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500"
          >
            Studiennavigator
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/hilfe"
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-full text-hit-gray-400 transition-colors hover:bg-hit-gray-100 hover:text-hit-uni-500"
            aria-label="Hilfe"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-hit-gray-200" />
          ) : session ? (
            <div className="hidden md:flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-hit-gray-600">
                <User className="h-4 w-4" />
                <span>{session.user?.name || session.user?.email}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut({ redirect: false })
                  window.location.href = '/'
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button variant="uni" size="sm">
                Anmelden
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300',
          mobileMenuOpen ? 'max-h-96 border-t' : 'max-h-0'
        )}
      >
        <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
          <Link
            href="/"
            className="py-2 text-sm font-medium text-hit-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Start
          </Link>
          <Link
            href="/events"
            className="py-2 text-sm font-medium text-hit-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Veranstaltungen
          </Link>
          <Link
            href="/schedule"
            className="py-2 text-sm font-medium text-hit-gray-600 flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Mein Stundenplan
            {scheduleCount > 0 && (
              <div className="flex items-center gap-1">
                <Badge
                  variant="default"
                  className="text-xs h-5 min-w-5 flex items-center justify-center bg-hit-uni-500"
                >
                  {scheduleCount}
                </Badge>
                {conflictCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-xs h-5 min-w-5 flex items-center justify-center gap-0.5"
                    title={`${conflictCount} Zeitkonflikt${conflictCount > 1 ? 'e' : ''}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {conflictCount}
                  </Badge>
                )}
              </div>
            )}
          </Link>
          <Link
            href="/programs"
            className="py-2 text-sm font-medium text-hit-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Studiengänge
          </Link>
          <Link
            href="/navigator"
            className="py-2 text-sm font-medium text-hit-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Studiennavigator
          </Link>
          <Link
            href="/hilfe"
            className="py-2 text-sm font-medium text-hit-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Hilfe
          </Link>
          {session && isAdmin && (
            <Link
              href="/admin"
              className="py-2 text-sm font-medium text-hit-gray-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin-Bereich
            </Link>
          )}
          <div className="border-t pt-4 mt-2">
            {session ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-hit-gray-600">
                  {session.user?.name || session.user?.email}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setMobileMenuOpen(false)
                    await signOut({ redirect: false })
                    window.location.href = '/'
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </Button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="uni" className="w-full">
                  Anmelden
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
