# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [0.16.0] - 2026-07-30

Feedback round following the data-entry ("Datenerfassung") test phase: a repaired export, a real
delete workflow for organizers, correct German alphabetical sorting, admin-editable homepage
texts, and a few housekeeping fixes.

### Added

- Admin event form: a **"Bestehende Melder*in übernehmen"** picker lets admins search existing
  Melder*innen by name, e-mail or organisational unit and fill the whole Melder profile from one
  click, instead of retyping contact details for every event. **"Neue Melder*in anlegen"** resets
  the form to enter a new person by hand.
- Organizers can now delete their own Veranstaltung directly, before the Anmeldefrist — via the
  "…" menu in the events list or a new delete button on the event's edit page. After the deadline,
  only an administrator can delete it.
- Admins can edit selected homepage texts (hero heading/intro, the four statistic tiles, and the
  Universität/Hochschule cards) on a new **Texte** page (`/admin/texte`). Changes go live
  immediately; **"Auf Standard zurücksetzen"** reverts a text to its shipped default.
- The homepage now shows a **"Noch x Tage bis zum HIT"** countdown to the event date.
- Numbered pagination (page numbers + "Seite X von Y · Z Veranstaltungen") replaces the old
  Zurück/Weiter-only controls on the public `/events` list and on the admin events list; it
  collapses to a compact `‹ 1/3 ›` indicator on narrow screens.

### Changed

- Alphabetical sorting throughout the site (Studiengänge, Studienfelder, Gebäude, filter
  dropdowns, exports, and the Studiengänge A-Z index) now follows correct German (DIN 5007-1)
  ordering. Names starting with Ö, Ä, Ü now sort in their proper place instead of after Z — e.g.
  "Ökotrophologie" now appears under **O** on the A-Z page.
- The "nach Studiengang" Excel export was extended: the first sheet is now a **Gesamtliste**
  listing all events, and every per-programme sheet (and the Gesamtliste) carries a **Studienfeld**
  column.
- The Universität's student figure on the homepage was corrected from "14.000+" to "13.000+".
- The admin events list now shows the server's actual German error message if deleting an event
  fails, instead of doing nothing without explanation.
- Fixed horizontal-overflow (unwanted side-scrolling) on the public event list and in the admin
  area on narrow mobile screens.

### Fixed

- The "nach Studiengang" Excel export previously failed with a server error (HTTP 500) once there
  were enough Studiengänge to produce duplicate or overly long worksheet names; export sheet names
  are now de-duplicated and truncated to Excel's limits before use.
- Deleting an event as an organizer previously had no effect through the API, because the delete
  endpoint did not check organizer/deadline permissions the same way the edit endpoint did; the
  two now use the same authorization rule.
- Removed the "Entwickler-Hinweis" box on the login page, which printed the admin login
  credentials on screen.

[0.16.0]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.16.0
