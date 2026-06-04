'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BarrierefreiheitPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Erklärung zur Barrierefreiheit</h1>

      <div className="space-y-6">
        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6">
            <p>
              Die Zentrale Studienberatung Osnabrück ist bemüht, den Webauftritt des
              Hochschulinfotags (HIT) im Einklang mit den nationalen Rechtsvorschriften zur
              Umsetzung der Richtlinie (EU) 2016/2102 des Europäischen Parlaments barrierefrei
              zugänglich zu machen.
            </p>
            <p>
              Diese Erklärung zur Barrierefreiheit gilt für die Website{' '}
              <strong>hit.zsb-os.de</strong>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stand der Vereinbarkeit mit den Anforderungen</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Diese Website ist mit den Web Content Accessibility Guidelines (WCAG) 2.1 Level AA und
              der BITV 2.0 teilweise vereinbar. Die nachstehend aufgeführten Inhalte sind nicht
              barrierefrei.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nicht barrierefreie Inhalte</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Die folgenden Inhalte sind aus den genannten Gründen nicht barrierefrei:</p>
            <ul>
              <li>
                Der interaktive Lageplan (Leaflet) ist möglicherweise nicht vollständig mit
                Screenreadern bedienbar.
              </li>
              <li>
                Der visuelle Stundenplan (Timeline-Ansicht) bietet eine alternative Listenansicht
                für Screenreader-Nutzer.
              </li>
              <li>PDF-Dokumente sind möglicherweise nicht vollständig barrierefrei.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erstellung dieser Erklärung</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Diese Erklärung wurde am <strong>{new Date().toLocaleDateString('de-DE')}</strong>{' '}
              erstellt.
            </p>
            <p>Die Überprüfung basiert auf einer Selbstbewertung.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback und Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Wenn Ihnen Mängel in Bezug auf die barrierefreie Gestaltung auffallen, können Sie uns
              kontaktieren:
            </p>
            <p>
              Zentrale Studienberatung Osnabrück
              <br />
              Neuer Graben 27
              <br />
              49074 Osnabrück
              <br />
              E-Mail:{' '}
              <a href="mailto:info@zsb-os.de" className="text-hit-uni-500 hover:underline">
                info@zsb-os.de
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schlichtungsverfahren</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Wenn auch nach Ihrem Feedback an den oben genannten Kontakt keine zufriedenstellende
              Lösung gefunden wurde, können Sie sich an die Schlichtungsstelle nach § 16 BGG wenden:
            </p>
            <p>
              Schlichtungsstelle nach dem Behindertengleichstellungsgesetz bei dem Beauftragten der
              Bundesregierung für die Belange von Menschen mit Behinderungen
              <br />
              Mauerstraße 53
              <br />
              10117 Berlin
            </p>
            <p>
              E-Mail:{' '}
              <a
                href="mailto:info@schlichtungsstelle-bgg.de"
                className="text-hit-uni-500 hover:underline"
              >
                info@schlichtungsstelle-bgg.de
              </a>
              <br />
              Internet:{' '}
              <a
                href="https://www.schlichtungsstelle-bgg.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hit-uni-500 hover:underline"
              >
                www.schlichtungsstelle-bgg.de
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
