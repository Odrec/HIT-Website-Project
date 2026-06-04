'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

      {/* Developer reminder — visible only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis für Entwickler:</strong> Matomo-Abschnitt hinzugefügt. Vor Go-Live:
            Datenschutzerklärung mit ZSB-Vorlage abgleichen und ggf. weitere Dienste ergänzen.
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datenschutz auf einen Blick</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mt-0">Allgemeine Hinweise</h4>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
            <h4 className="font-semibold">Datenerfassung auf dieser Website</h4>
            <p>
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              <br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber:
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
            <CardTitle>Verantwortliche Stelle</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Verantwortliche Stelle im Sinne der Datenschutzgesetze ist:</p>
            <p>
              Hochschule Osnabrück
              <br />
              Albrechtstraße 30
              <br />
              49076 Osnabrück
            </p>
            <p>
              <strong>Datenschutzbeauftragte/r:</strong>
              <br />
              Der/die Datenschutzbeauftragte der Hochschule Osnabrück ist erreichbar unter:{' '}
              <a
                href="mailto:datenschutz@hs-osnabrueck.de"
                className="text-hit-uni-500 hover:underline"
              >
                datenschutz@hs-osnabrueck.de
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datenerfassung auf dieser Website</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h4 className="font-semibold mt-0">Server-Log-Dateien</h4>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
              Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </p>
            <ul>
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p>
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die
              Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>

            <h4 className="font-semibold">Lokale Speicherung (localStorage)</h4>
            <p>
              Diese Website verwendet die lokale Speicherung (localStorage) Ihres Browsers, um Ihren
              persönlichen Stundenplan zu speichern. Diese Daten werden ausschließlich lokal auf Ihrem
              Gerät gespeichert und nicht an unsere Server übermittelt.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webanalyse mit Matomo</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Diese Website verwendet Matomo, eine Open-Source-Software zur statistischen Auswertung
              der Besucherzugriffe. Matomo wird auf Servern der Universität Osnabrück betrieben —
              Ihre Daten werden nicht an Dritte weitergegeben.
            </p>
            <h4 className="font-semibold">Was wird erfasst?</h4>
            <ul>
              <li>Aufgerufene Seiten und Zeitpunkt des Zugriffs</li>
              <li>Gerätetyp (Desktop, Mobil, Tablet), Browser und Betriebssystem</li>
              <li>Anonymisierte Nutzungsdaten (z.B. Filterverwendung, Stundenplanaktionen)</li>
            </ul>
            <h4 className="font-semibold">Keine Cookies</h4>
            <p>
              Matomo wird auf dieser Website im cookielosen Modus betrieben. Es werden keine Cookies
              gesetzt und keine Daten im Browser gespeichert. Eine Wiedererkennung über mehrere
              Sitzungen hinweg findet nicht statt.
            </p>
            <h4 className="font-semibold">Rechtsgrundlage</h4>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an der statistischen Analyse des Nutzerverhaltens zur Verbesserung des
              Webangebots).
            </p>
            <h4 className="font-semibold">Widerspruch (Opt-Out)</h4>
            <p>
              Sie können die Erfassung durch Matomo jederzeit unterbinden. Nutzen Sie dafür die
              folgende Option:
            </p>
            {process.env.NEXT_PUBLIC_MATOMO_URL && (
              <iframe
                title="Matomo Opt-Out"
                style={{ border: 0, width: '100%', height: '200px' }}
                src={`${process.env.NEXT_PUBLIC_MATOMO_URL}index.php?module=CoreAdminHome&action=optOut&language=de`}
              />
            )}
            {!process.env.NEXT_PUBLIC_MATOMO_URL && (
              <p className="text-sm text-gray-500 italic">
                Die Opt-Out-Option wird verfügbar, sobald Matomo konfiguriert ist.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ihre Rechte</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Sie haben jederzeit das Recht:</p>
            <ul>
              <li>
                <strong>Auskunft</strong> über Ihre bei uns gespeicherten personenbezogenen Daten zu
                erhalten (Art. 15 DSGVO)
              </li>
              <li>
                <strong>Berichtigung</strong> unrichtiger personenbezogener Daten zu verlangen (Art.
                16 DSGVO)
              </li>
              <li>
                <strong>Löschung</strong> Ihrer bei uns gespeicherten personenbezogenen Daten zu
                verlangen (Art. 17 DSGVO)
              </li>
              <li>
                <strong>Einschränkung der Verarbeitung</strong> Ihrer personenbezogenen Daten zu
                verlangen (Art. 18 DSGVO)
              </li>
              <li>
                <strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art. 21 DSGVO)
              </li>
              <li>
                <strong>Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)
              </li>
            </ul>
            <p>
              Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen
              das Datenschutzrecht verstößt, haben Sie das Recht, sich bei einer Aufsichtsbehörde zu
              beschweren (Art. 77 DSGVO).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hosting</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Diese Website wird auf Servern der Universität Osnabrück gehostet. Die Server befinden
              sich in Deutschland. Weitere Informationen zum Datenschutz der Universität Osnabrück
              finden Sie unter:{' '}
              <a
                href="https://www.uni-osnabrueck.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hit-uni-500 hover:underline"
              >
                uni-osnabrueck.de/datenschutz
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
