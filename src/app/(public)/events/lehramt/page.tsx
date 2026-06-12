import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getLehramtPageData } from '@/services/lehramt-service'
import { LehramtPageContent } from '@/components/lehramt/LehramtPageContent'

export const dynamic = 'force-dynamic'

const ZFL_URL =
  'https://www.uni-osnabrueck.de/studieren/unsere-studienangebote/abschluesse-und-ordnungen/lehramt-bachelor-und-master'

export default async function LehramtEventsPage() {
  const data = await getLehramtPageData()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">Lehramt</h1>
        <div className="mt-3 max-w-3xl space-y-3 text-hit-gray-600">
          <p>
            Allgemeine Informationen zu den verschiedenen Lehramtsstudiengängen finden Sie auf den
            Seiten des{' '}
            <a
              href={ZFL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-hit-uni-600 underline hover:no-underline"
            >
              Zentrums für Lehrkräftebildung
            </a>
            .
          </p>
          <p>
            Wir empfehlen neben dem Besuch der allgemeinen Vorträge zum Lehramtsstudium auch die
            Teilnahme an Veranstaltungen der Sie interessierenden Unterrichtsfächer und beruflichen
            Fachrichtungen.
          </p>
          <p>
            Besuchen Sie gerne auch den Stand der Lehramtskooperative auf dem Infomarkt. Am Stand
            beantworten Lehramtsstudierende Fragen rund um das Lehramtsstudium in Osnabrück.
          </p>
        </div>
      </div>
      <LehramtPageContent data={data} />
    </div>
  )
}
