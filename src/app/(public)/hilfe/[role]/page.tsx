import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HelpLayout } from '@/components/help/HelpLayout'
import type { TocEntry } from '@/components/help/TableOfContents'

const VALID_ROLES = ['besucher', 'veranstalter', 'admin'] as const
type Role = (typeof VALID_ROLES)[number]

const roleTitles: Record<Role, string> = {
  besucher: 'Anleitung für Besucher',
  veranstalter: 'Anleitung für Veranstalter',
  admin: 'Anleitung für Admins',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }
      return map[match] || match
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function extractToc(markdown: string): TocEntry[] {
  const headingRegex = /^## (.+)$/gm
  const entries: TocEntry[] = []
  let match
  while ((match = headingRegex.exec(markdown)) !== null) {
    entries.push({ id: slugify(match[1]), text: match[1] })
  }
  return entries
}

interface HelpRolePageProps {
  params: Promise<{ role: string }>
}

export default async function HelpRolePage({ params }: HelpRolePageProps) {
  const { role } = await params

  if (!VALID_ROLES.includes(role as Role)) {
    notFound()
  }

  const filePath = path.join(process.cwd(), 'content', 'hilfe', `${role}.md`)

  let markdown: string
  try {
    markdown = fs.readFileSync(filePath, 'utf-8')
  } catch {
    notFound()
  }

  const tocEntries = extractToc(markdown)

  const components = {
    h1: () => null,
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
      const text = typeof children === 'string' ? children : String(children)
      const id = slugify(text)
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      )
    },
  }

  return (
    <HelpLayout title={roleTitles[role as Role]} tocEntries={tocEntries} currentRole={role}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </HelpLayout>
  )
}

export function generateStaticParams() {
  return VALID_ROLES.map((role) => ({ role }))
}
