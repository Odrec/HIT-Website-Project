import Link from 'next/link'
import { HelpCircle } from 'lucide-react'

interface HelpLinkProps {
  href: string
}

export function HelpLink({ href }: HelpLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md bg-hit-gray-100 px-2.5 py-1 text-xs text-hit-gray-500 transition-colors hover:bg-hit-gray-200 hover:text-hit-gray-700"
    >
      <HelpCircle className="h-3.5 w-3.5" />
      <span>Hilfe</span>
    </Link>
  )
}
