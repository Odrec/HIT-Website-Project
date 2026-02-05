# HIT-Website Project

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> Event management and visitor planning system for the Higher Education Information Day (Hochschulinformationstag) at ZSB Osnabrück.

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/homepage.png" alt="Homepage" width="400" />
  <img src="docs/screenshots/events.png" alt="Events Listing" width="400" />
</p>

<p align="center">
  <img src="docs/screenshots/navigator.png" alt="Study Navigator" width="400" />
  <img src="docs/screenshots/route-planner.png" alt="Route Planner with Campus Map" width="400" />
</p>

---

## 🎯 Overview

The HIT-Website provides a comprehensive platform for organizing and attending university open days:

| Feature | Description |
|---------|-------------|
| **Event Browsing** | Browse and search all HIT events with advanced filtering |
| **Schedule Builder** | Create personalized event schedules with conflict detection |
| **Study Navigator** | AI-powered study program recommendations using OpenAI/Gemini |
| **Route Planner** | Navigate between campus locations with walking time estimates |
| **Event Recommendations** | Smart suggestions based on interests and schedule |
| **Admin Interface** | Manage events, programs, locations, and users |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 with App Router |
| **Language** | TypeScript 5.0 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL 16 with Prisma ORM |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | NextAuth.js with credentials provider |
| **Maps** | Leaflet + React-Leaflet |
| **AI/LLM** | OpenAI GPT-4o / Google Gemini 1.5 |
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

The AI-powered Study Navigator requires one of these providers:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key ([get one](https://platform.openai.com/api-keys)) | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |
| `GOOGLE_AI_API_KEY` | Google AI API key ([get one](https://makersuite.google.com/app/apikey)) | - |
| `GOOGLE_AI_MODEL` | Gemini model to use | `gemini-1.5-flash` |

> 💡 If both OpenAI and Google AI keys are set, OpenAI takes priority.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public URL (for client-side) | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes (events, schedule, navigator)
│   ├── (admin)/           # Admin routes (protected)
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout components (Header, Footer, etc.)
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
| `/api/events/public` | GET | List all public events (paginated) | 5 min |
| `/api/events/public/[id]` | GET | Get single event details | 5 min |
| `/api/study-programs` | GET | List all study programs | 15 min |
| `/api/locations` | GET | List all locations | 1 hour |
| `/api/routes` | POST | Calculate route between locations | No |
| `/api/recommendations` | POST | Get event recommendations | No |
| `/api/navigator` | POST | AI navigator chat | No |

### Admin Endpoints (Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET, POST | List/create events |
| `/api/events/[id]` | GET, PUT, DELETE | Manage single event |
| `/api/users` | GET, POST | Manage users |
| `/api/locations` | POST, PUT, DELETE | Manage locations |
| `/api/study-programs` | POST, PUT, DELETE | Manage study programs |

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

### Quick Load Test

```bash
# Start the app first
npm run dev

# Run load test (in another terminal)
npx ts-node scripts/load-test.ts
```

### Custom Load Test

```bash
LOAD_TEST_URL=http://localhost:3000 \
LOAD_TEST_CONCURRENT=100 \
LOAD_TEST_DURATION=60 \
npx ts-node scripts/load-test.ts
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
- Verify `OPENAI_API_KEY` or `GOOGLE_AI_API_KEY` is set in `.env.local`
- Check API key has sufficient credits/quota
- Try a different model (e.g., `gpt-4o-mini` is faster/cheaper)

#### Slow performance
- Ensure Redis is running (caching)
- Check database indexes: `npx prisma migrate deploy`
- Review [Testing Guide](docs/TESTING-GUIDE.md) for performance optimization

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Testing Guide](docs/TESTING-GUIDE.md) | Load testing, cross-browser testing, performance |

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
