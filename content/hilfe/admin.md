# Anleitung für Admins

Als Admin haben Sie Zugriff auf alle Verwaltungsfunktionen der HIT-Website.

## Dashboard

Das Dashboard zeigt eine Übersicht: Anzahl der Veranstaltungen, Gebäude, Studiengänge und Benutzer. Nutzen Sie es als Einstiegspunkt in die Verwaltung.

## Veranstaltungen verwalten

Unter **Veranstaltungen** sehen und verwalten Sie alle gemeldeten Events. Sie können Veranstaltungen erstellen, bearbeiten und löschen. Nutzen Sie die Suche und Filter, um schnell bestimmte Einträge zu finden.

## Gebäude & Räume

Unter **Gebäude** verwalten Sie alle Campus-Gebäude mit Räumen, Adressen und Koordinaten. Diese Daten werden im Routenplaner, in der Kartenansicht und bei der Raumzuordnung verwendet. Jedes Gebäude kann Kurzname, Campus-Zuordnung, GPS-Koordinaten und Barrierefreiheit-Infos enthalten.

**Wichtig:** GPS-Koordinaten (Breitengrad und Längengrad) sind **erforderlich**, damit Veranstaltungen in diesem Gebäude im Routenplaner und auf der Campuskarte angezeigt werden. Fehlen die Koordinaten, werden die zugehörigen Veranstaltungen stillschweigend aus der Routenberechnung entfernt — sie bleiben im persönlichen Zeitplan der Besucher sichtbar, erscheinen aber nicht in der Routenplaner-Liste. Prüfen Sie die Koordinaten nach dem Anlegen eines neuen Gebäudes.

## Raumzuordnungen

Unter **Raumzuordnung** weisen Sie Veranstaltungen bestimmten Räumen und Zeitslots zu. Das System warnt bei Doppelbelegungen.

## Melder

Die **Melder**-Verwaltung zeigt alle Veranstalter-Kontakte. Hier sehen Sie, wer welche Veranstaltungen gemeldet hat.

## Studiengänge

Verwalten Sie die Studiengangsliste unter **Studiengänge**. Jeder Eintrag enthält Name, Institution (Uni/HS), Fachbereich und den Link zur offiziellen Seite.

## Benutzer & Rollen

Unter **Benutzer** verwalten Sie die Zugänge. Es gibt drei Rollen: **Admin** (Vollzugriff), **Veranstalter** (eigene Events) und **Öffentlich** (nur Lesen). Legen Sie neue Benutzer an oder ändern Sie bestehende Rollen.

## Import / Export

Unter **Import / Export** können Sie Veranstaltungsdaten als Excel-Datei importieren oder exportieren. Unterstützte Formate: Excel (.xlsx), PDF und HTML.

## Shuttle-Busse

Unter **Shuttle-Busse** verwalten Sie die GPS-verfolgten Shuttle-Busse für den HIT-Tag. Sie können Busse hinzufügen, aktivieren oder deaktivieren und löschen. Für jeden Bus wird ein **QR-Code** generiert, den die Busbegleiter (Guides) mit ihrem Smartphone scannen. Die Guides öffnen damit eine Webseite, die ihren Standort automatisch an die HIT-Website sendet. Besucher sehen die Live-Positionen auf der Campuskarte im Routenplaner. Bei Sicherheitsbedenken können Sie den Token eines Busses jederzeit über **„Token erneuern"** neu generieren.

## Editionen & Rollover

Jede HIT wird als eigene **Edition** verwaltet. Immer genau eine Edition ist aktiv (Status `ACTIVE`), weitere sind `DRAFT` (in Vorbereitung) oder `ARCHIVED` (abgeschlossen).

**Aktuelle Edition bearbeiten:** Unter **Editionen** (`/admin/editions`) kannst du HIT-Datum und Einsendeschluss der aktiven Edition anpassen.

**Neue Edition starten (Rollover):** Auf der aktiven Edition auf **Neue Edition starten** klicken. Im Dialog:

1. Jahr eingeben (vorausgefüllt mit dem Folgejahr)
2. HIT-Datum angeben
3. Einsendeschluss optional setzen
4. Checkbox **Alle Veranstaltungen übernehmen** aktiv lassen, um die Veranstaltungen der aktuellen Edition als Entwürfe ins Prüfstand zu kopieren

Nach dem Rollover:

- Die alte Edition wird automatisch auf `ARCHIVED` gesetzt
- Die neue Edition ist `ACTIVE`
- Kopierte Veranstaltungen haben den Status `DRAFT_FROM_ROLLOVER`, ihre Zeiten sind geleert
- Der Melder bleibt erhalten, sofern das Konto noch existiert

## Prüfstand

Unter **Prüfstand** (`/admin/pruefstand`) findest du alle aus dem Rollover kopierten Veranstaltungen, die noch nicht veröffentlicht sind.

Pro Zeile:

- **Bearbeiten** öffnet das Formular; der Status wechselt beim Speichern auf `NEEDS_REVIEW`. Ein Hinweis oben im Formular zeigt die Quelle an: *Aus: HIT {Jahr} · {Titel}*.
- **Veröffentlichen** flippt den Status auf `PUBLISHED`. Die Veranstaltung erscheint auf der öffentlichen Seite.
- **Verwerfen** löscht den Entwurf. Die Quellveranstaltung in der archivierten Edition bleibt unberührt.

Mehrfachauswahl mit den Checkboxen links, dann **Veröffentlichen** oben drücken für Bulk-Aktion.

Das **Sidebar-Badge** zeigt live die Anzahl noch nicht veröffentlichter Entwürfe.

## Vergangene Editionen

Archivierte Editionen bleiben in der Datenbank. Kurzlinks (`/s/<code>`) aus einer älteren Edition funktionieren weiterhin: sie öffnen den Stundenplan **schreibgeschützt** mit einem Hinweis auf das ursprüngliche HIT-Jahr.
