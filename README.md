# HIT-Website Project

Event management and visitor planning system for the Higher Education Information Day (Hochschulinformationstag) at ZSB Osnabrück.

## 🎯 Overview

The HIT-Website provides:
- **Event Browsing**: Browse and search all HIT events
- **Schedule Builder**: Create personalized event schedules
- **Study Navigator**: AI-powered study program recommendations
- **Route Planner**: Navigate between event locations
- **Admin Interface**: Manage events, programs, and users

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Auth**: NextAuth.js with credentials provider
- **Deployment**: Vercel + Docker

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local database)
- Git

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

If you don't have Docker installed, you can:
1. Use cloud services like [Neon](https://neon.tech) (free PostgreSQL) and [Upstash](https://upstash.com) (free Redis)
2. Install PostgreSQL and Redis locally via Homebrew:
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

# Edit with your values
# Default values work with docker-compose setup
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

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes
│   ├── (admin)/           # Admin routes (protected)
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── events/            # Event components
│   └── schedule/          # Schedule builder components
├── lib/
│   ├── db/                # Database utilities
│   ├── auth/              # Authentication utilities
│   └── cache/             # Redis cache utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── services/              # Business logic services
```

## 🔐 Default Admin Login

After running the seed script:
- **Email**: admin@zsb-os.de
- **Password**: admin123

⚠️ Change this password immediately in production!

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

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo in Vercel Dashboard
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

## 📊 Performance Targets

Based on November 2025 traffic analysis:
- **Peak concurrent users**: 5,000
- **Page load time**: < 2 seconds
- **API response time**: < 500ms
- **Uptime during HIT**: 99.9%

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run lint and type check
4. Submit PR

## 📄 License

All rights reserved. © ZSB Osnabrück

## 📞 Contact

Zentrale Studienberatung Osnabrück
- Email: zsb@uni-osnabrueck.de
- Web: https://www.zsb-os.de
