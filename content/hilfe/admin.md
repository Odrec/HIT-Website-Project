# Anleitung für Admins

Als Admin haben Sie Zugriff auf alle Verwaltungsfunktionen der HIT-Website.

## Dashboard

Das Dashboard zeigt eine Übersicht: Anzahl der Veranstaltungen, Gebäude, Studiengänge und Benutzer. Nutzen Sie es als Einstiegspunkt in die Verwaltung.

## Veranstaltungen verwalten

Unter **Veranstaltungen** sehen und verwalten Sie alle gemeldeten Events. Sie können Veranstaltungen erstellen, bearbeiten und löschen. Nutzen Sie die Suche und Filter, um schnell bestimmte Einträge zu finden; die Trefferzahl und die Blätter-Schaltflächen finden Sie sowohl über als auch unter der Liste.

Im Veranstaltungsformular wählen Sie u. a. den **Veranstaltungstyp** (Vortrag, Laborführung, Rundgang, Workshop, Online, Video, Infostand, Schnupperveranstaltung, Interaktion, Sonstiges) und die **Institution** (muss aktiv gewählt werden). Das **Datum** wird zentral über die aktive Edition vorgegeben (siehe „Editionen & Rollover") und lässt sich nicht pro Veranstaltung ändern. Wählen Sie als Institution **Hochschulübergreifend**, gilt die Veranstaltung automatisch als externes Angebot der Kategorie **Rund ums Studium** und erscheint nicht in den Uni-/Hochschul-Listen. Für Infostände sind 08:30–14:00 Uhr voreingetragen (änderbar).

## Gebäude & Räume

Unter **Gebäude** verwalten Sie alle Campus-Gebäude mit Räumen, Adressen und Koordinaten. Diese Daten werden im Routenplaner, in der Kartenansicht und bei der Raumzuordnung verwendet. Jedes Gebäude kann Kurzname, Campus-Zuordnung, GPS-Koordinaten und Barrierefreiheit-Infos enthalten.

**Wichtig:** GPS-Koordinaten (Breitengrad und Längengrad) sind **erforderlich**, damit Veranstaltungen in diesem Gebäude im Routenplaner und auf dem Lageplan angezeigt werden. Fehlen die Koordinaten, werden die zugehörigen Veranstaltungen stillschweigend aus der Routenberechnung entfernt — sie bleiben im persönlichen Stundenplan der Besucher sichtbar, erscheinen aber nicht in der Routenplaner-Liste. Prüfen Sie die Koordinaten nach dem Anlegen eines neuen Gebäudes.

## Raumzuordnungen

Unter **Raumzuordnung** weisen Sie Veranstaltungen bestimmten Räumen und Zeitslots zu. Das System warnt bei Doppelbelegungen.

## Melder

Unter **Melder** verwalten Sie die Einreicher*innen-Profile, die Veranstaltungen am HIT angemeldet haben. Sie können neue Melder direkt anlegen (**Neuer Melder**), bestehende Einträge bearbeiten oder löschen. Die Melder werden zusätzlich automatisch angelegt, sobald Sie über das Veranstaltungsformular eine neue Person eintragen — die E-Mail-Adresse dient als eindeutige Kennung. Wird die Veranstaltung gespeichert, erscheint der Melder direkt in der Liste.

Im Melder-Profil hängen die abgefragten Felder von der **Zugehörigkeit** ab: Hochschule → *Fakultät*, Universität → *Fachbereich*, Beide bzw. Extern → *Institution* (ein gemeinsames Feld). Externe Melder geben statt eines Raums eine **Adresse** an.

Hinweis: Melder, die noch mit aktiven Veranstaltungen verknüpft sind, lassen sich nicht löschen. Passen Sie zuerst die Veranstaltungen an (etwa auf einen anderen Melder umstellen) oder löschen Sie sie.

## Studiengänge

Verwalten Sie die Studiengangsliste unter **Studiengänge**. Jeder Eintrag enthält Name, Institution (Universität/Hochschule), die Zuordnung zu Studienfeldern und **einen oder mehrere benannte Links** zu den offiziellen Seiten (z. B. Fach, 2-Fächer-Bachelor, BEU, Lehramt). Beim Zuordnen werden nur die Studienfelder der gewählten Institution angeboten.

Im Dialog finden Sie außerdem einen Block **Lehramt**: Hier wählen Sie über Mehrfach-Auswahl die **Schulformen** aus, denen der Studiengang zugeordnet ist (*Lehramt an Grund-, Haupt- und Realschulen*, *Lehramt an Gymnasien*, *Lehramt an berufsbildenden Schulen*). Ein Unterrichtsfach wird **einmal angelegt und mehreren Schulformen zugeordnet**. Sobald mindestens eine Schulform gewählt ist, erscheint die Checkbox **Ist Lehramts-Studiengang (kein Unterrichtsfach)** — setzen Sie sie genau für den einen Studiengang pro Schulform, dessen Veranstaltungen auf der Lehramt-Seite zuerst erscheinen sollen. Ist *Lehramt an berufsbildenden Schulen* gewählt (und es handelt sich nicht um den Lehramts-Studiengang), erscheint zusätzlich die Checkbox **Berufliche Fachrichtung**. Diese Klassifikation steuert, in welchem Bereich der öffentlichen Lehramt-Seite der Studiengang und seine Veranstaltungen erscheinen.

## Studienfelder (Cluster)

Die Studienfelder sind in zwei Gruppen aufgeteilt: **Universität** (6 Cluster, inkl. Lehramt) und **Hochschule** (7 Cluster). Beim Anlegen eines neuen Clusters müssen Sie über das Pflichtfeld **Institution** angeben, zu welcher Hochschule das Cluster gehört (`UNI` oder `HOCHSCHULE`) — die öffentliche Einstiegsseite zeigt die beiden Gruppen getrennt mit Farbakzent (Uni-Rot, HS-Blau). Die Studiengänge werden den Clustern in der Studiengangs-Verwaltung zugeordnet.

## Benutzer & Rollen

Unter **Benutzer** verwalten Sie die Zugänge. Es gibt drei Rollen: **Admin** (Vollzugriff), **Veranstalter** (eigene Events) und **Öffentlich** (nur Lesen). Legen Sie neue Benutzer an oder ändern Sie bestehende Rollen.

## Import / Export

Unter **Import / Export** können Sie Veranstaltungsdaten als Excel-Datei importieren oder exportieren. Verfügbar sind mehrere Excel-Ansichten (A-Z, nach Zeit, nach Raum, nach Studiengang, Melder, Dozierende, Infomärkte) sowie eine **Gesamtmappe** mit einer Gesamtübersicht als erstem Blatt; außerdem die PDF-Programmbroschüre (mit Inhaltsverzeichnis) und ein HTML-Backup.

## Shuttle-Busse

Unter **Shuttle-Busse** verwalten Sie die GPS-verfolgten Shuttle-Busse für den HIT-Tag. Sie können Busse hinzufügen, aktivieren oder deaktivieren und löschen. Für jeden Bus wird ein **QR-Code** generiert, den die Busbegleiter (Guides) mit ihrem Smartphone scannen. Die Guides öffnen damit eine Webseite, die ihren Standort automatisch an die HIT-Website sendet. Besucher sehen die Live-Positionen auf dem Lageplan im Routenplaner. Pausiert ein Bus, zeigt die Admin-Liste **„Pausiert bis HH:MM"** und der Bus erscheint auf der Karte gedämpft; über **„Pause aufheben"** beenden Sie eine Pause vorzeitig. Bei Sicherheitsbedenken können Sie den Token eines Busses jederzeit über **„Token erneuern"** neu generieren.

Hinweise zur Bus-Begleitung: Die Hilfskraft im Bus muss nach dem Scannen des QR-Codes einmalig den **Standortzugriff** im Browser erlauben. Der Tab muss während der gesamten Schicht geöffnet bleiben — bei iOS Safari pausiert die Standortübertragung, sobald das Display gesperrt wird; bei Android Chrome läuft sie meist weiter, sobald die Berechtigung einmal erteilt wurde. Bei längeren Pausen empfiehlt sich ein erneutes Öffnen des Links. Für geplante Pausen kann die Hilfskraft auf der Tracking-Seite **„Pause bis …"** wählen (z. B. +15/+30/+45 Minuten oder offen) — das Tracking ruht dann sichtbar, **„Weiter"** nimmt es wieder auf. Zuverlässiges Tracking im Hintergrund (gesperrtes Display, andere App im Vordergrund) ist im Browser technisch nicht garantiert.

## Editionen & Rollover

Jede HIT wird als eigene **Edition** verwaltet. Immer genau eine Edition ist aktiv (Status `ACTIVE`), weitere sind `DRAFT` (in Vorbereitung) oder `ARCHIVED` (abgeschlossen).

**Aktuelle Edition bearbeiten:** Unter **Editionen** (`/admin/editions`) kannst du HIT-Datum und Einsendeschluss der aktiven Edition anpassen. Hier wählst du auch die Veranstaltung für das **Multiplikator\*innen-Café** aus: das Dropdown listet alle Veranstaltungen der aktiven Edition. Solange keine Veranstaltung gewählt ist, blendet die öffentliche Einstiegsseite den Link „Multiplikator\*innen-Café" aus.

**Neue Edition starten (Rollover):** Auf der aktiven Edition auf **Neue Edition starten** klicken. Im Dialog:

1. Jahr eingeben (vorausgefüllt mit dem Folgejahr; es genügt eine **eindeutige** Jahreszahl — für eine Testübernahme ist auch eine andere, z. B. niedrigere Zahl möglich)
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
