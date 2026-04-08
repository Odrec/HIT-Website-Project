import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, ClipboardList, Settings } from 'lucide-react'

const roles = [
  {
    slug: 'besucher',
    title: 'Für Besucher',
    description: 'Veranstaltungen finden, Stundenplan erstellen, Navigator nutzen',
    icon: GraduationCap,
    color: 'bg-hit-uni-500',
    hoverColor: 'hover:border-hit-uni-300',
  },
  {
    slug: 'veranstalter',
    title: 'Für Veranstalter',
    description: 'Veranstaltungen erstellen und verwalten',
    icon: ClipboardList,
    color: 'bg-hit-hs-500',
    hoverColor: 'hover:border-hit-hs-300',
  },
  {
    slug: 'admin',
    title: 'Für Admins',
    description: 'Vollständige Verwaltung aller Bereiche',
    icon: Settings,
    color: 'bg-hit-gray-700',
    hoverColor: 'hover:border-hit-gray-400',
  },
]

export default function HilfePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Hilfe & Anleitung</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Willkommen im HIT-Hilfebereich. Wählen Sie den passenden Bereich für Ihre Rolle:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Link key={role.slug} href={`/hilfe/${role.slug}`}>
            <Card className={`h-full text-center transition-colors border-2 border-transparent ${role.hoverColor}`}>
              <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${role.color} text-white`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-1">{role.title}</h2>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
