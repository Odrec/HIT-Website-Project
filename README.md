# HIT-Website Project

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> Event management and visitor planning system for the Higher Education Information Day (Hochschulinfotag) at ZSB Osnabrück.

---

## 📸 Screenshots

| | |
|---|---|
| ![Homepage](docs/screenshots/homepage.png) | ![Events Listing](docs/screenshots/events.png) |
| ![Study Navigator](docs/screenshots/navigator.png) | ![Route Planner with Campus Map](docs/screenshots/route-planner.png) |

---

## 🎯 Overview

The HIT-Website provides a comprehensive platform for organizing and attending university open days:

| Feature | Description |
|---------|-------------|
| **Event Browsing** | Entry-point landing on `/events` with search bar, separate Studienfeld tiles for Universität and Hochschule, and dedicated links for Lehramt, Studiengänge A-Z, Infomärkte, Rund ums Studium, and the Multiplikator\*innen-Café event. Studienfeld tiles open an intermediate programs list at `/events/cluster/[id]` (mirroring the old zsb-os.de pattern); the "Alle Veranstaltungen dieses Studienfelds anzeigen" CTA from there links to `/events/cluster/[id]/all`. Other entries open their own sub-route with full filtering (event type, institution, time, sort, list/grid/calendar views). Study programs link to external Uni/HS pages |
| **Merkliste & Schedule Builder** | Loose **Merkliste** (watchlist) to collect events before committing, then a personal **Stundenplan** with conflict detection, travel-time + spatial-proximity warnings, 3-level priority labels (Hoch/Mittel/Niedrig), QR code/short link sharing, Google Calendar integration |
| **Study Navigator** | AI-powered study program recommendations using OpenAI/Gemini/vLLM |
| **Route Planner** | Navigate between campus locations with Google Directions API walking routes, cached for performance. Click schedule events to filter individual route legs on the map, or hand the whole plan off to Google Maps for turn-by-turn navigation |
| **Shuttle Bus Tracking** | Real-time GPS tracking of shuttle buses between campuses — guides share location via web page (with a timed "Pause bis …" status), visitors see live markers and official Zeichen 224 bus stop icons on the campus map |
| **Event Recommendations** | Smart suggestions based on interests and schedule, with transparent scoring documentation |
| **Admin Interface** | Manage events, programs, locations, users, room assignments, and site settings (HIT date, submission deadline) |
| **Rights Management** | Event ownership enforcement, admin-configurable submission deadline with hard lock for organizers |
| **Data Export** | Excel exports (per-view sheets — A-Z, time, room, Studiengang, Melder, Dozierende, Infomärkte — plus a combined workbook with an overview sheet first), CSV import/export, PDF program booklet with table of contents, HTML backup, iCal export |
| **Email Notifications** | Automatic email to HIT team on event create/edit with change detection |
| **Analytics** | Cookieless Matomo tracking with custom events (schedule, search, filters) |
| **Legal Pages** | Impressum, Datenschutz (with Matomo disclosure), Barrierefreiheit (BITV 2.0) |

### Multi-Year Support

This installation serves multiple HIT editions over time. Each `HitEdition` (one `ACTIVE` at a time, others `DRAFT` or `ARCHIVED`) scopes events, user schedules, and shared-schedule links. Admins manage editions via `/admin/editions` and roll over to the next year via a one-click "Neue Edition starten" action that clones events into a Prüfstand review queue (`/admin/pruefstand`) for finalization. Past-edition shared-schedule short-links continue to resolve cross-edition.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 with App Router |
| **Language** | TypeScript 5, React 19 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL 16 with Prisma 7 ORM |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | NextAuth v5 (role-based: Admin, Organizer, Public) |
| **Maps** | Leaflet + React-Leaflet |
| **AI/LLM** | OpenAI GPT-4o / Google Gemini 1.5 / vLLM (local) |
| **Exports** | ExcelJS, @react-pdf/renderer, iCal |
| **Email** | Nodemailer (SMTP) |
| **Analytics** | Matomo (cookieless) |
| **Sharing** | nanoid (short links), qrcode.react (QR codes) |
| **Testing** | Vitest + React Testing Library |
| **Deployment** | Vercel + Docker |

---

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local database) — or external PostgreSQL/Redis
- Git

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd HIT-Website-Project
npm install
```

### 2. Start Local Services

**Option A: Using Docker (recommended)**
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait for services to be ready
docker-compose ps
```

**Option B: Without Docker**

Use cloud services like [Neon](https://neon.tech) (free PostgreSQL) and [Upstash](https://upstash.com) (free Redis), or install locally:
```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb hit_db
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values (see Environment Variables section below)
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://hit_user:hit_password@localhost:5432/hit_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js (generate with `openssl rand -base64 32`) | - |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |

### AI Configuration (Study Navigator)

The AI-powered Study Navigator supports OpenAI, Google Gemini, or any OpenAI-compatible server (vLLM, Ollama, etc.):

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_BASE_URL` | Base URL for OpenAI-compatible API (e.g., `http://localhost:8000/v1` for vLLM) | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | API key for OpenAI or local server (optional for local servers without auth) | - |
| `OPENAI_MODEL` | Model name (e.g., `gpt-4o-mini`, `meta-llama/Llama-3.1-8B-Instruct`) | `gpt-4o-mini` |
| `GOOGLE_AI_API_KEY` | Google AI API key ([get one](https://makersuite.google.com/app/apikey)) | - |
| `GOOGLE_AI_MODEL` | Gemini model to use | `gemini-1.5-flash` |

> Priority: `OPENAI_API_BASE_URL` / `OPENAI_API_KEY` > `GOOGLE_AI_API_KEY` > fallback mode.
>
> **vLLM example:** Set `OPENAI_API_BASE_URL=http://localhost:8000/v1` and `OPENAI_MODEL=your-model-name`. Add `OPENAI_API_KEY` only if your vLLM server requires authentication.

### Email Notifications (SMTP)

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `EMAIL_FROM` | Sender email address | - |
| `EMAIL_TO` | Notification recipient | `hit@zsb.os.de` |

> `EMAIL_TO` is server-only and controls **where notifications are delivered**. It's separate from the public contact address shown in the site footer — set that via `CONTACT_EMAIL` below.

### Public Contact Email

| Variable | Description | Default |
|----------|-------------|---------|
| `CONTACT_EMAIL` | Address rendered as the public contact link in the site footer. Server-only — read at request time, so a deploy-time change to `.env` (followed by a container restart) takes effect without rebuilding the image. | `hit@zsb.os.de` |

### Matomo Analytics

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MATOMO_URL` | Matomo instance URL | - |
| `NEXT_PUBLIC_MATOMO_SITE_ID` | Matomo site ID | - |

### Homepage Hero Banner

The homepage ships with two interchangeable hero backgrounds. Set the variable below to switch.

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ANIMATED_BANNER` | When `"true"`, renders the animated SVG hero (gradient + grid + slowly moving graphic elements from `public/banner/elemente_benannt.svg`). Any other value keeps the static PNG (`public/infotag-banner.png`). | `false` |

> The static PNG remains the safe default until the ZSB delivers final hero assets. The animated banner respects `prefers-reduced-motion` and switches to a non-cropping fit on portrait viewports.
>
> **Build-time variable.** `NEXT_PUBLIC_*` values are inlined into the client bundle at `npm run build`, so for the Docker image this must be set as a build-arg in CI (see `.github/workflows/docker-publish.yml`). Setting it on the runtime container (`/opt/hit-website/.env`) has no effect — the bundle has already been built.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `EXPORT_API_KEY` | API key for cron-triggered HTML export | - |
| `GOOGLE_MAPS_API_KEY` | Google Maps Directions API key (server-side, for walking routes) | - |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes
│   │   ├── events/        # Entry-point landing + sub-routes:
│   │   │                  #   cluster/[id], lehramt, a-z, rund-ums-studium,
│   │   │                  #   infomaerkte, search, [id] (detail)
│   │   ├── schedule/      # Personal schedule + shared schedule renderer
│   │   ├── navigator/     # AI study navigator
│   │   └── route-planner/ # Campus route map
│   ├── (admin)/           # Admin routes (events, room assignments, import/export, editions)
│   └── api/               # API routes (includes export/excel, export/pdf, health)
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout components (Header, Footer, etc.)
│   ├── admin/             # Admin components (ExportCard, etc.)
│   ├── events/            # Event-related components
│   ├── schedule/          # Schedule builder components
│   ├── navigator/         # AI navigator components
│   ├── recommendations/   # Recommendation components
│   └── map/               # Campus map components
├── lib/
│   ├── db/                # Database utilities (Prisma)
│   ├── auth/              # Authentication utilities
│   └── cache/             # Redis cache utilities
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── contexts/              # React context providers
```

---

## 🔐 Default Admin Login

After running the seed script:
- **Email**: admin@zsb-os.de
- **Password**: admin123

⚠️ **Change this password immediately in production!**

---

## 📡 API Endpoints

### Public Endpoints

| Endpoint | Method | Description | Cache |
|----------|--------|-------------|-------|
| `/api/health` | GET | Liveness check for the container healthcheck | No |
| `/api/events/public` | GET | List all public events (paginated). Supports `clusterId` and `lehramtCombined=true` filters used by event sub-routes | 5 min |
| `/api/events/public/[id]` | GET | Get single event details | 5 min |
| `/api/clusters` | GET | List `StudyProgramCluster` rows grouped by institution (`{ uni: [...], hochschule: [...] }`) | No |
| `/api/multiplikator-cafe` | GET | Currently configured Multiplikator\*innen-Café event id from the active edition (`{ eventId: string \| null }`) | No |
| `/api/study-programs` | GET | List all study programs | 15 min |
| `/api/buildings` | GET | List all buildings with rooms | 1 hour |
| `/api/routes` | POST | Calculate route between locations | No |
| `/api/routes/directions` | GET | Walking directions with cache (Google API fallback) | DB |
| `/api/routes/analyze` | POST | Travel-time analysis between consecutive routable schedule events | No |
| `/api/settings/deadline` | GET | Public deadline info (date, passed, days remaining) | No |
| `/api/recommendations` | POST | Get event recommendations | No |
| `/api/navigator` | POST | AI navigator chat | No |
| `/api/schedule/share` | POST | Create short link for schedule sharing | No |
| `/api/schedule/share/[code]` | GET | Look up shared schedule by code | No |
| `/api/bus-positions` | GET | Get live shuttle bus positions and stops | 5s |
| `/api/bus-positions` | POST | Update bus position (guide token auth) | No |

### Admin Endpoints (Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET, POST | List/create events |
| `/api/events/[id]` | GET, PUT, DELETE | Manage single event |
| `/api/users` | GET, POST | Manage users |
| `/api/buildings` | POST | Create building |
| `/api/buildings/[id]` | GET, PUT, DELETE | Manage single building |
| `/api/study-programs` | POST, PUT, DELETE | Manage study programs |
| `/api/export/excel?view=<type>` | GET | Excel export (8 view types) |
| `/api/export/pdf/booklet` | GET | PDF program booklet |
| `/api/export/html` | GET | Static HTML backup (API key or admin auth) |
| `/api/admin/export-schedule` | GET, POST | Manage scheduled HTML exports |
| `/api/settings` | GET, PUT | Site settings (HIT date, deadline) |
| `/api/routes/seed` | POST | Pre-compute walking routes via Google API |
| `/api/admin/shuttle-buses` | GET, POST | Manage shuttle buses |
| `/api/admin/shuttle-buses/[id]` | PUT, DELETE | Update/delete shuttle bus |
| `/api/admin/shuttle-buses/[id]/regenerate-token` | POST | Regenerate guide token |

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | Run TypeScript check |

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove all data
docker-compose down -v

# Start with Redis Commander (GUI)
docker-compose --profile tools up -d
```

---

## 🧪 Testing

For comprehensive testing instructions, see **[Testing Guide](docs/TESTING-GUIDE.md)**.

### Load Testing

Load tests run via [k6](https://k6.io). See
[`loadtest/README.md`](loadtest/README.md) for installation and the
available scenarios (smoke, ramp, spike, soak).

```bash
BASE_URL=http://localhost:3000 npm run loadtest:smoke
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo in [Vercel Dashboard](https://vercel.com)
3. Configure environment variables
4. Deploy!

### Docker

```bash
# Build image
docker build -t hit-website .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  hit-website
```

---

## 📊 Performance Targets

Based on November 2025 traffic analysis:

| Metric | Target |
|--------|--------|
| Peak concurrent users | 5,000 |
| Page load time | < 2 seconds |
| API response time | < 500ms |
| Uptime during HIT | 99.9% |

---

## 🔧 Troubleshooting

### Common Issues

#### Database connection fails
```bash
# Check if PostgreSQL is running
docker-compose ps

# Verify connection string format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

#### Redis connection fails
```bash
# Check if Redis is running
docker-compose logs redis

# Test connection
redis-cli ping
```

#### Prisma client not generated
```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, create migration
npx prisma migrate dev
```

#### AI Navigator not responding
- Verify `OPENAI_API_BASE_URL`, `OPENAI_API_KEY`, or `GOOGLE_AI_API_KEY` is set in `.env.local`
- For local LLMs (vLLM): ensure the server is running and reachable at the configured URL
- Check API key has sufficient credits/quota (cloud providers)
- Try a different model (e.g., `gpt-4o-mini` is faster/cheaper)

#### Slow performance
- Ensure Redis is running (caching)
- Check database indexes: `npx prisma migrate deploy`
- Review the [Testing Guide](docs/TESTING-GUIDE.md) for performance optimization

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Make changes
3. Run lint and type check (`npm run lint && npm run type-check`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
