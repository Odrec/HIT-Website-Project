'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImpressumPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Impressum</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Angaben gemäß § 5 TMG</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Die Zentrale Studienberatung Osnabrück (ZSB) ist eine gemeinsame Einrichtung der
              Universität Osnabrück und der Hochschule Osnabrück.
            </p>
            <p>
              <strong>Universität Osnabrück</strong>
              <br />
              Körperschaft des öffentlichen Rechts
              <br />
              vertreten durch die Präsidentin Prof. Dr. Susanne Menzel-Riedl
            </p>
            <p>
              <strong>Hochschule Osnabrück</strong>
              <br />
              Körperschaft des öffentlichen Rechts
              <br />
              vertreten durch den Präsidenten Prof. Dr. Dennis Zielke
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Zentrale Studienberatung Osnabrück
              <br />
              Neuer Graben 27
              <br />
              49074 Osnabrück
            </p>
            <p>
              Fax: +49 541 969 4999
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
            <CardTitle>Aufsichtsbehörde</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Niedersächsisches Ministerium für Wissenschaft und Kultur
              <br />
              Leibnizufer 9
              <br />
              30169 Hannover
            </p>
            <p>Umsatzsteuer-ID: DE 154 285 400</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Johanna Risse
              <br />
              Dirk Mochalski
              <br />
              Zentrale Studienberatung Osnabrück
              <br />
              Neuer Graben 27
              <br />
              49074 Osnabrück
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Haftungsausschluss</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mt-0">Haftung für Inhalte</h4>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            </p>
            <h4 className="font-semibold">Haftung für Links</h4>
            <p>
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
              übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
