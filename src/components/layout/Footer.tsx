import Link from 'next/link'

/**
 * Footer component with institutional links and information
 */
export function Footer() {
  return (
    <footer className="border-t bg-hit-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About HIT */}
          <div>
            <h3 className="font-semibold text-hit-gray-900 mb-3">Hochschulinformationstag</h3>
            <p className="text-sm text-hit-gray-600">
              Der HIT bietet Studieninteressierten die Möglichkeit, Universität und Hochschule
              Osnabrück kennenzulernen.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-hit-gray-900 mb-3">Schnellzugriff</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-hit-gray-600 hover:text-hit-uni-500">
                  Alle Veranstaltungen
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-hit-gray-600 hover:text-hit-uni-500">
                  Stundenplan erstellen
                </Link>
              </li>
              <li>
                <Link href="/navigator" className="text-hit-gray-600 hover:text-hit-uni-500">
                  Studiennavigator
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-hit-gray-600 hover:text-hit-uni-500">
                  Campusplan
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutions */}
          <div>
            <h3 className="font-semibold text-hit-gray-900 mb-3">Institutionen</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.uni-osnabrueck.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hit-gray-600 hover:text-hit-uni-500"
                >
                  Universität Osnabrück
                </a>
              </li>
              <li>
                <a
                  href="https://www.hs-osnabrueck.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hit-gray-600 hover:text-hit-hs-500"
                >
                  Hochschule Osnabrück
                </a>
              </li>
              <li>
                <a
                  href="https://www.zsb-os.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hit-gray-600 hover:text-hit-uni-500"
                >
                  Zentrale Studienberatung
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-hit-gray-900 mb-3">Kontakt</h3>
            <address className="not-italic text-sm text-hit-gray-600 space-y-1">
              <p>Zentrale Studienberatung Osnabrück</p>
              <p>Neuer Graben 27</p>
              <p>49074 Osnabrück</p>
              <p className="pt-2">
                <a href="mailto:zsb@uni-osnabrueck.de" className="hover:text-hit-uni-500">
                  zsb@uni-osnabrueck.de
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-hit-gray-500">
          <p>
            © {new Date().getFullYear()} Zentrale Studienberatung Osnabrück. Alle Rechte
            vorbehalten.
          </p>
          <p className="mt-2 space-x-4">
            <Link href="/impressum" className="hover:text-hit-gray-700">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-hit-gray-700">
              Datenschutz
            </Link>
            <Link href="/barrierefreiheit" className="hover:text-hit-gray-700">
              Barrierefreiheit
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
