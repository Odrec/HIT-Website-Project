'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, Settings, AlertTriangle, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/contexts/schedule-context'

function getInitials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.split('@')[0]
  const parts = cleaned.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return cleaned.slice(0, 2).toUpperCase()
}

/**
 * Main header component with navigation and user menu
 */
export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { state, getConflicts, getWatchlistCount } = useSchedule()

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'ORGANIZER'
  const scheduleCount = state.items.length
  const conflictCount = getConflicts().length
  const watchlistCount = getWatchlistCount()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Institutional Logos — official ZSB combined-logo split into two clickable halves */}
        <div className="flex items-center">
          <a href="https://www.uni-osnabrueck.de" target="_blank" rel="noopener noreferrer">
            <Image
              src="/logos/uos-half.svg"
              alt="Universität Osnabrück"
              width={215}
              height={67}
              className="h-9 w-auto sm:h-11"
            />
          </a>
          <a href="https://www.hs-osnabrueck.de" target="_blank" rel="noopener noreferrer">
            <Image
              src="/logos/hs-half.svg"
              alt="Hochschule Osnabrück"
              width={215}
              height={67}
              className="h-9 w-auto sm:h-11"
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
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500 flex items-center gap-1.5"
          >
            Mein Stundenplan
            {scheduleCount > 0 && (
              <Badge
                variant={conflictCount > 0 ? 'destructive' : 'default'}
                className={cn(
                  'h-5 px-1.5 text-xs flex items-center gap-0.5',
                  conflictCount === 0 && 'bg-hit-uni-500'
                )}
                title={
                  conflictCount > 0
                    ? `${scheduleCount} Veranstaltungen, ${conflictCount} Zeitkonflikt${conflictCount > 1 ? 'e' : ''}`
                    : `${scheduleCount} Veranstaltungen`
                }
              >
                {conflictCount > 0 && <AlertTriangle className="h-3 w-3" />}
                {scheduleCount}
              </Badge>
            )}
          </Link>
          <Link
            href="/merkliste"
            className="text-sm font-medium text-hit-gray-600 transition-colors hover:text-hit-uni-500 flex items-center gap-1.5"
          >
            Merkliste
            {watchlistCount > 0 && (
              <Badge
                className="h-5 px-1.5 text-xs flex items-center gap-0.5 bg-amber-500"
                title={`${watchlistCount} gemerkte Veranstaltung${watchlistCount > 1 ? 'en' : ''}`}
              >
                {watchlistCount}
              </Badge>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden md:flex items-center justify-center h-9 w-9 rounded-full bg-hit-uni-500 text-white text-xs font-semibold transition-colors hover:bg-hit-uni-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hit-uni-500 focus-visible:ring-offset-2"
                  aria-label="Benutzermenü"
                >
                  {getInitials(session.user?.name || session.user?.email || '?')}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                  {session.user?.name && session.user?.email && (
                    <span className="text-xs font-normal text-hit-gray-500">
                      {session.user.email}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin-Bereich
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut({ redirect: false })
                    window.location.href = '/'
                  }}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <Badge
                variant={conflictCount > 0 ? 'destructive' : 'default'}
                className={cn(
                  'h-5 px-1.5 text-xs flex items-center gap-0.5',
                  conflictCount === 0 && 'bg-hit-uni-500'
                )}
              >
                {conflictCount > 0 && <AlertTriangle className="h-3 w-3" />}
                {scheduleCount}
              </Badge>
            )}
          </Link>
          <Link
            href="/merkliste"
            className="py-2 text-sm font-medium text-hit-gray-600 flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Merkliste
            {watchlistCount > 0 && (
              <Badge className="h-5 px-1.5 text-xs flex items-center gap-0.5 bg-amber-500">
                {watchlistCount}
              </Badge>
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
