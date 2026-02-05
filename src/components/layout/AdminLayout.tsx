'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Veranstaltungen',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    title: 'Studiengänge',
    href: '/admin/study-programs',
    icon: GraduationCap,
  },
  {
    title: 'Standorte',
    href: '/admin/locations',
    icon: MapPin,
  },
  {
    title: 'Benutzer',
    href: '/admin/users',
    icon: Users,
    adminOnly: true,
  },
]

/**
 * Admin layout with sidebar navigation
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  const filteredItems = sidebarItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex min-h-screen bg-hit-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-hit-uni-500 to-hit-hs-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">
              <span className="text-hit-uni-500">HIT</span>
              <span className="text-hit-gray-400"> Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-hit-uni-50 text-hit-uni-600'
                    : 'text-hit-gray-600 hover:bg-hit-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hit-uni-100 text-hit-uni-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-hit-gray-900 truncate">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-xs text-hit-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.href = '/'
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="font-bold">
            <span className="text-hit-uni-500">HIT</span>
            <span className="text-hit-gray-400"> Admin</span>
          </span>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-hit-uni-50 text-hit-uni-600'
                    : 'text-hit-gray-600 hover:bg-hit-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold">
            <span className="text-hit-uni-500">HIT</span>
            <span className="text-hit-gray-400"> Admin</span>
          </span>
        </header>

        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b bg-white px-6 lg:flex">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-hit-gray-600 hover:text-hit-uni-500"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Website
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-hit-gray-600">{session?.user?.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
