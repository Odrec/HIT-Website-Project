'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Settings,
  LayoutDashboard,
  FileSpreadsheet,
} from 'lucide-react'

const navItems = [
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
    title: 'Orte',
    href: '/admin/locations',
    icon: MapPin,
  },
  {
    title: 'Benutzer',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Import/Export',
    href: '/admin/import-export',
    icon: FileSpreadsheet,
  },
  {
    title: 'Einstellungen',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = 
          item.href === '/admin' 
            ? pathname === '/admin' 
            : pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#003366] text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

export default AdminNav
