# HIT-Website-Project

## Project Overview
Web-based event management and visitor planning system for the Higher Education Information Day (HIT) at ZSB Osnabrueck. HIT date: **November 19, 2026**.

## Tech Stack
- **Framework:** Next.js 16 App Router, React 19, TypeScript
- **Database:** PostgreSQL with Prisma 6 ORM
- **Auth:** NextAuth v5 (role-based: ADMIN, ORGANIZER, PUBLIC)
- **Styling:** Tailwind CSS + shadcn/ui
- **Maps:** Leaflet
- **AI/LLM:** OpenAI / Google Gemini / vLLM (any OpenAI-compatible server)
- **Testing:** Vitest + React Testing Library
- **Language:** All UI text in German

## Current Status
All core features are **fully implemented**: event form (with Building/Room models, photo upload, 15-min time picker, Melder persistence), exports (Excel 8-view, PDF booklet, HTML room assignments), schedule with iCal export, footer legal pages (Impressum/Datenschutz), email notifications (SMTP via nodemailer), route planner (Google Directions API with cached routes, per-leg filtering, Meine Orte filter, official Zeichen 224 bus stop icons), rights management (event ownership, submission deadlines), user manual/help system, contextual help links, shuttle bus GPS tracking (guide geolocation, admin management with QR codes, live bus markers on campus map), SVG integration (official UOS cluster icons on study programs/events/filters/PDF, institution logos in footer and PDF booklet cover), and Hochschul Infotag banner on homepage. Clusters renamed to official UOS faculty groupings (6 categories with dedicated icons). Building model consolidated as single source of truth for locations, coordinates, and routing (old Location model removed).

**Remaining/pending items:**
- **Matomo analytics** — waiting for tenant setup from Andrea Tschentscher (RZ)

## Key Decisions
- **Mobile-first design** — students primarily use phones
- **Corporate colors:** Uni = `#AC0634` (burgundy), HS = `#009EE3` (cyan blue)
- **Footer legal pages:** Local pages, copy from ZSB (Impressum/Datenschutz), update Datenschutz at project end
- **Study program links:** External links to Uni/HS pages, no internal pages
- **Default browse view:** Cluster view (both cluster and A-Z implemented)
- **Email relay:** `relay.rz.uni-osnabrueck.de` port 25, no auth needed (Uninetz only)
- **Email notifications:** Full event details in email, trigger on both new submissions and edits (to hit@zsb.os.de)
- **Routing API:** Google Maps Directions API (included in university cloud contract)
- **Analytics:** UOS Matomo instance, request tenant from Andrea Tschentscher (RZ)
- **No social login:** Anonymous profiles only, shared via QR/short link (avoids Datenschutz issues)
- **Event times are Berlin wall-clock:** DB columns are `timestamp without time zone` holding Berlin values, and JS Dates carry those values in their UTC components. Always format event timestamps via `src/lib/event-time.ts` helpers (`formatEventTime`, `formatEventDateLong`, `isSameEventDay`, etc.) — never `date-fns format()`, `toLocaleTimeString()`, or local `getHours()/getMinutes()` on event timestamps. The `EventForm` save path appends `Z` to the typed time so writes interpret it as Berlin wall-clock too. Real-time data (bus positions, chat messages) keeps user-local formatting.
- **Conflict detection is centralized:** All schedule conflict checks go through `src/lib/schedule-conflicts.ts` (`eventPairOverlapMinutes`, `detectConflicts`). Both the client `ScheduleContext` and server `recommendation-service` delegate to it. Infostände never participate in conflicts (all-day walk-in events). Do not re-implement overlap math or Infostand-skip logic elsewhere — a previous regression was caused exactly by that duplication.

## Git Conventions
- Never add "Co-Authored-By" lines to commit messages
- Use feature branches with descriptive names
- PRs to main branch
