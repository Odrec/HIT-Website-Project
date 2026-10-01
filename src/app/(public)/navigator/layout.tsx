import { notFound } from 'next/navigation'
import { NAVIGATOR_ENABLED } from '@/lib/features'

/** /navigator is a 404 while the Studiennavigator is switched off (src/lib/features.ts). */
export default function NavigatorLayout({ children }: { children: React.ReactNode }) {
  if (!NAVIGATOR_ENABLED) notFound()
  return children
}
