# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [0.17.3] - 2026-09-24

Navigation and map fixes reported by the ZSB test round.

### Fixed

- The mobile menu was missing the **Routenplanung** entry.
- The Lageplan opened somewhere in the Alps when the Stundenplan was empty: buildings without
  stored coordinates were averaged in as 0°/0°. Buildings without a position are now excluded from
  the map centre and from the markers, and the routing APIs answer 422 instead of routing to 0/0.
- The campus dropdown above the map (Schloss, Westerberg, Caprivi) did not change the visible map
  section and, because the database spells campuses as "Innenstadt", "Westerberg", "Caprivi", it
  matched no building at all and every popup said "Sonstige". Campus values are now normalised once
  on the server (`src/lib/campus.ts`), and choosing a campus flies the map to its buildings.
- Shuttle-bus stop signs were drawn half a sign too high: the round Zeichen 224 icon was anchored at
  its bottom edge instead of its centre.
- PDF booklet: the Hochschule's "Zentrale Angebote" were merged into the Universität's section
  of the same name. Sections are now keyed by institution and name.

## [0.17.2] - 2026-09-24

### Fixed

- Studiennavigator: the "Nächste Schritte" links under the recommendations (Studienberatung,
  Studieren probieren, Tests zur Studienorientierung) and the psychological-counselling link in the
  crisis banner pointed to pages that do not exist. They now go to the verified ZSB and
  Studentenwerk pages, which cover both Universität and Hochschule.

## [0.17.1] - 2026-09-21

### Fixed

- Studiennavigator: internal catalogue IDs such as "(P76)" no longer appear in the chat text; they
  are stripped server-side and the model is told to keep them out of the visible reply.
- Studiennavigator: a revised recommendation after a follow-up question stays at five entries at
  most.

## [0.17.0] - 2026-09-21

Studiennavigator rework: the recommendations are now produced by the language model itself,
based on the programme catalogue from the database, instead of a keyword matcher. This is the
answer to the ZSB feedback that the old suggestions did not hold up against the university's
Studiengangsplaner.

### Changed

- **Studiennavigator recommendations come from the model.** The full list of Studiengänge
  (name, Universität/Hochschule, Studienfeld, Lehramt tags) is read from the database and handed
  to the model with every message, so changes made in the admin area show up in the navigator
  within ten minutes without a redeploy. The model asks four to five guided questions with
  tap-able answer options (a fixed first question on preferred kinds of activities, one on
  Lehramt with a Schulform follow-up), then names three to five Studiengänge with a one-sentence
  reason each and the matching HIT events. Afterwards the chat stays open for follow-up
  questions, and the model may revise its list.
- The recommendation cards show the model's reason instead of a percentage score; a summary
  sentence sits above the list. Programmes recommended as Lehramtsstudiengang or berufliche
  Fachrichtung add a pointer to the Kombinationsregeln on the Lehramt page.
- Answer options render as chips with a short description; free text is always possible.
- Navigator sessions are stored in Redis (two-hour lifetime) with an in-memory fallback, so a
  container restart no longer drops running conversations. Sessions are processed one message at
  a time, and a failed message leaves no trace in the conversation.
- `/api/navigator` is rate-limited per IP (20 messages and 10 new sessions per minute) and
  validates client-supplied session IDs.

### Removed

- The keyword-based programme scorer and the offline fallback question script. When the language
  model gateway is unreachable, the chat now shows "Der Studiennavigator ist gerade nicht
  erreichbar" with a link to the Studienfelder instead of made-up results.
- Google Gemini support (`GOOGLE_AI_API_KEY`, `GOOGLE_AI_MODEL`). Only OpenAI-compatible
  endpoints (`OPENAI_API_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`) remain, which is what the
  LiteLLM setup uses.

### Fixed

- Nature-related conversations no longer surface Soziale Arbeit or Fahrzeugtechnik because of
  substring matches on "arbeiten" or "Ökosysteme".
- Links in chat replies are limited to internal paths and http(s) URLs; anything else renders as
  plain text.

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

[0.17.3]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.17.3
[0.17.2]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.17.2
[0.17.1]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.17.1
[0.17.0]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.17.0
[0.16.0]: https://github.com/Odrec/HIT-Website-Project/releases/tag/v0.16.0
