# Phase 1: Project Setup & Foundation - Detailed Implementation Plan

**Goal:** Establish the complete development infrastructure with proper commits at each step.

**Estimated Commits:** 18 atomic commits  
**Stack:** Next.js 14 + TypeScript + Tailwind CSS + PostgreSQL + Prisma + Redis + NextAuth.js

---

## Commit Structure Overview

```mermaid
flowchart TD
    A[1. Initialize Next.js project] --> B[2. Configure Tailwind CSS]
    B --> C[3. Install shadcn/ui]
    C --> D[4. Project structure setup]
    D --> E[5. ESLint + Prettier config]
    E --> F[6. Environment variables]
    F --> G[7. Install Prisma ORM]
    G --> H[8. Core database schema]
    H --> I[9. Events schema]
    I --> J[10. Schedules schema]
    J --> K[11. Seed data scripts]
    K --> L[12. NextAuth.js setup]
    L --> M[13. RBAC middleware]
    M --> N[14. Redis configuration]
    N --> O[15. Layout components]
    O --> P[16. Navigation components]
    P --> Q[17. Docker development setup]
    Q --> R[18. Deployment config]
```

---

## Step-by-Step Implementation

### Commit 1: Initialize Next.js project with TypeScript

**Command:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Files Created:**
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `.gitignore`
- `.eslintrc.json`

**Commit Message:**
```
feat: initialize Next.js 14 project with TypeScript

- Created Next.js 14 app with App Router
- TypeScript configured
- Tailwind CSS included via create-next-app
- Using src/ directory structure
- Import alias @/* configured
```

---

### Commit 2: Configure Tailwind CSS for the project

**Files to Modify:**
- `tailwind.config.ts` - Add custom theme colors, fonts, spacing
- `src/app/globals.css` - Add custom CSS variables for theming

**Custom Configuration:**
```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        'hit-primary': '#003366',      // University blue
        'hit-secondary': '#FF6B00',    // Hochschule orange
        'hit-accent': '#00A651',       // Success green
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

**Commit Message:**
```
feat: configure Tailwind CSS with HIT brand colors

- Added custom color palette for Uni and Hochschule
- Configured custom font family
- Set up CSS variables for dynamic theming
```

---

### Commit 3: Install and configure shadcn/ui

**Commands:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select
```

**Files Created:**
- `components.json`
- `src/lib/utils.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`

**Commit Message:**
```
feat: install shadcn/ui with core components

- Initialized shadcn/ui configuration
- Added Button, Card, Input, Label, Select components
- Created utility functions in lib/utils.ts
```

---

### Commit 4: Set up project folder structure

**Directories to Create:**
```
src/
├── app/
│   ├── (public)/          # Public routes
│   ├── (admin)/           # Admin routes
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn components
│   ├── layout/            # Layout components
│   ├── events/            # Event-related components
│   ├── schedule/          # Schedule builder components
│   └── shared/            # Shared/common components
├── lib/
│   ├── db/                # Database utilities
│   ├── auth/              # Auth utilities
│   ├── cache/             # Redis utilities
│   └── utils.ts
├── types/                 # TypeScript types
├── hooks/                 # Custom React hooks
└── services/              # Business logic services
```

**Files to Create:**
- `src/types/index.ts` - Type exports
- `src/types/events.ts` - Event types
- `src/types/auth.ts` - Auth types
- `src/hooks/index.ts` - Hook exports
- `src/services/index.ts` - Service exports

**Commit Message:**
```
chore: establish project folder structure

- Created organized directory structure for components
- Added types, hooks, and services directories
- Separated public and admin route groups
- Added placeholder index files
```

---

### Commit 5: Configure ESLint and Prettier

**Files to Create/Modify:**
- `.eslintrc.json` - Extended rules
- `.prettierrc` - Formatting rules
- `.prettierignore`

**Install:**
```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Configuration:**
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Commit Message:**
```
chore: configure ESLint and Prettier

- Added Prettier with consistent formatting rules
- Extended ESLint config with Prettier integration
- Added .prettierignore for build artifacts
```

---

### Commit 6: Set up environment variables

**Files to Create:**
- `.env.example` - Template with all required variables
- `.env.local` - Local development (gitignored)
- `src/lib/env.ts` - Type-safe environment access

**Environment Variables:**
```bash
# .env.example
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hit_db"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Commit Message:**
```
chore: configure environment variables structure

- Created .env.example with all required variables
- Added type-safe environment variable access
- Documented required configuration
```

---

### Commit 7: Install and configure Prisma ORM

**Commands:**
```bash
npm install prisma @prisma/client
npx prisma init
```

**Files Created/Modified:**
- `prisma/schema.prisma` - Base schema configuration
- `src/lib/db/prisma.ts` - Prisma client singleton

**Base Schema:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models will be added in subsequent commits
```

**Commit Message:**
```
feat: install and configure Prisma ORM

- Initialized Prisma with PostgreSQL provider
- Created Prisma client singleton for connection pooling
- Set up base schema configuration
```

---

### Commit 8: Create database schema - Core tables

**Add to schema.prisma:**
```prisma
// Enums
enum Institution {
  UNI
  HOCHSCHULE
  BOTH
}

enum EventType {
  VORTRAG
  LABORFUEHRUNG
  RUNDGANG
  WORKSHOP
  LINK
  INFOSTAND
}

enum LocationType {
  INFOMARKT_SCHLOSS
  INFOMARKT_CN
  OTHER
}

enum UserRole {
  ADMIN
  ORGANIZER
  PUBLIC
}

// Core Tables
model StudyProgramCluster {
  id          String         @id @default(cuid())
  name        String
  description String?
  programs    StudyProgram[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model StudyProgram {
  id          String                @id @default(cuid())
  name        String
  institution Institution
  clusterId   String?
  cluster     StudyProgramCluster?  @relation(fields: [clusterId], references: [id])
  events      EventStudyProgram[]
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}

model Location {
  id           String   @id @default(cuid())
  buildingName String
  roomNumber   String?
  address      String?
  latitude     Float?
  longitude    Float?
  events       Event[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model InformationMarket {
  id       String                    @id @default(cuid())
  name     String
  location String
  events   EventInformationMarket[]
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name init_core_tables
```

**Commit Message:**
```
feat: add core database schema tables

- Added enums for Institution, EventType, LocationType, UserRole
- Created StudyProgramCluster and StudyProgram tables
- Created Location and InformationMarket tables
- Applied initial migration
```

---

### Commit 9: Create database schema - Events and related tables

**Add to schema.prisma:**
```prisma
model Event {
  id              String                    @id @default(cuid())
  title           String                    @db.VarChar(200)
  description     String?
  eventType       EventType
  timeStart       DateTime?
  timeEnd         DateTime?
  locationType    LocationType
  locationDetails Json?
  roomRequest     String?
  meetingPoint    String?
  additionalInfo  String?
  photoUrl        String?
  institution     Institution
  locationId      String?
  location        Location?                 @relation(fields: [locationId], references: [id])
  lecturers       Lecturer[]
  organizers      EventOrganizer[]
  studyPrograms   EventStudyProgram[]
  infoMarkets     EventInformationMarket[]
  scheduleItems   ScheduleItem[]
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  @@index([eventType])
  @@index([institution])
  @@index([timeStart])
}

model Lecturer {
  id         String  @id @default(cuid())
  eventId    String
  event      Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  firstName  String
  lastName   String
  title      String?
  email      String?
  building   String?
  roomNumber String?
}

model EventOrganizer {
  id           String  @id @default(cuid())
  eventId      String
  event        Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  email        String
  phone        String?
  internalOnly Boolean @default(true)
}

model EventStudyProgram {
  eventId        String
  studyProgramId String
  event          Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  studyProgram   StudyProgram @relation(fields: [studyProgramId], references: [id], onDelete: Cascade)

  @@id([eventId, studyProgramId])
}

model EventInformationMarket {
  eventId  String
  marketId String
  event    Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  market   InformationMarket @relation(fields: [marketId], references: [id], onDelete: Cascade)

  @@id([eventId, marketId])
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add_events_tables
```

**Commit Message:**
```
feat: add events database schema with relationships

- Created Event table with all required fields
- Added Lecturer and EventOrganizer tables
- Created junction tables for study programs and info markets
- Added database indexes for common queries
```

---

### Commit 10: Create database schema - Schedules and user data

**Add to schema.prisma:**
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String?
  name          String?
  role          UserRole       @default(PUBLIC)
  schedules     UserSchedule[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model UserSchedule {
  id            String         @id @default(cuid())
  userId        String?
  user          User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId     String?        // For anonymous users
  name          String?        @default("My Schedule")
  items         ScheduleItem[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([sessionId])
  @@index([userId])
}

model ScheduleItem {
  id         String       @id @default(cuid())
  scheduleId String
  schedule   UserSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  eventId    String
  event      Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  priority   Int          @default(1)
  notes      String?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  @@unique([scheduleId, eventId])
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add_schedules_tables
```

**Commit Message:**
```
feat: add user schedules database schema

- Created User table with role-based access
- Added UserSchedule for both registered and anonymous users
- Created ScheduleItem with priority support
- Added indexes for efficient querying
```

---

### Commit 11: Add seed data scripts

**Files to Create:**
- `prisma/seed.ts`
- `prisma/data/study-programs.json`
- `prisma/data/sample-events.json`

**Update package.json:**
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**Install:**
```bash
npm install -D ts-node
```

**Commit Message:**
```
feat: add database seed scripts with sample data

- Created seed script with study programs from both institutions
- Added sample events for testing
- Created sample locations and clusters
- Configured prisma seed command
```

---

### Commit 12: Set up authentication with NextAuth.js

**Commands:**
```bash
npm install next-auth @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

**Files to Create:**
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth/auth-options.ts`
- `src/lib/auth/providers.ts`

**Commit Message:**
```
feat: configure NextAuth.js authentication

- Installed NextAuth.js with Prisma adapter
- Configured credentials provider for admin/organizer login
- Set up session handling with JWT strategy
- Created auth configuration utilities
```

---

### Commit 13: Create role-based access control middleware

**Files to Create:**
- `src/middleware.ts` - Next.js middleware for route protection
- `src/lib/auth/rbac.ts` - Role-based access utilities
- `src/lib/auth/session.ts` - Session helpers

**Commit Message:**
```
feat: implement role-based access control middleware

- Created middleware for protecting admin routes
- Added RBAC utility functions
- Implemented session helper functions
- Protected /admin/* routes for admin/organizer roles
```

---

### Commit 14: Set up Redis configuration for caching

**Commands:**
```bash
npm install ioredis
```

**Files to Create:**
- `src/lib/cache/redis.ts` - Redis client singleton
- `src/lib/cache/cache-keys.ts` - Centralized cache key management
- `src/lib/cache/cache-utils.ts` - Caching utility functions

**Commit Message:**
```
feat: configure Redis for caching

- Created Redis client singleton with connection pooling
- Added cache key management utilities
- Implemented cache get/set/invalidate helpers
- Configured for event listings and study program caching
```

---

### Commit 15: Create basic layout components

**Files to Create:**
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/AdminLayout.tsx`

**Commit Message:**
```
feat: create base layout components

- Added Header with branding and navigation
- Created Footer with institutional links
- Built Sidebar for admin navigation
- Created MainLayout for public pages
- Created AdminLayout for admin dashboard
```

---

### Commit 16: Create navigation components

**Files to Create:**
- `src/components/layout/NavMenu.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/UserMenu.tsx`
- `src/components/layout/Breadcrumbs.tsx`

**Commit Message:**
```
feat: add navigation components

- Created responsive navigation menu
- Added mobile navigation drawer
- Built user menu with login/logout
- Added breadcrumb component for admin
```

---

### Commit 17: Docker development setup

**Files to Create:**
- `docker-compose.yml` - PostgreSQL + Redis for local development
- `docker-compose.prod.yml` - Production configuration
- `.dockerignore`
- `Dockerfile` - Multi-stage build

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hit_user
      POSTGRES_PASSWORD: hit_password
      POSTGRES_DB: hit_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Commit Message:**
```
chore: add Docker configuration for development

- Created docker-compose.yml with PostgreSQL and Redis
- Added production Docker compose configuration
- Created multi-stage Dockerfile for deployment
- Added .dockerignore for optimized builds
```

---

### Commit 18: Configure deployment pipeline

**Files to Create:**
- `vercel.json` - Vercel deployment config
- `.github/workflows/ci.yml` - GitHub Actions CI
- `.github/workflows/deploy.yml` - Deployment workflow
- `README.md` - Project documentation

**Commit Message:**
```
chore: configure CI/CD pipeline

- Added Vercel deployment configuration
- Created GitHub Actions CI workflow
- Set up automated deployment workflow
- Added comprehensive README documentation
```

---

## Summary

| Step | Description | Key Files |
|------|-------------|-----------|
| 1 | Initialize Next.js | package.json, tsconfig.json |
| 2 | Configure Tailwind | tailwind.config.ts |
| 3 | Install shadcn/ui | components.json, ui/* |
| 4 | Project structure | Directory structure |
| 5 | ESLint/Prettier | .eslintrc.json, .prettierrc |
| 6 | Environment vars | .env.example, lib/env.ts |
| 7 | Install Prisma | prisma/schema.prisma |
| 8 | Core schema | StudyProgram, Location |
| 9 | Events schema | Event, Lecturer, Organizer |
| 10 | Schedules schema | User, Schedule, ScheduleItem |
| 11 | Seed data | prisma/seed.ts |
| 12 | NextAuth.js | api/auth, auth-options.ts |
| 13 | RBAC middleware | middleware.ts, rbac.ts |
| 14 | Redis config | cache/redis.ts |
| 15 | Layout components | Header, Footer, Layouts |
| 16 | Navigation | NavMenu, MobileNav |
| 17 | Docker setup | docker-compose.yml |
| 18 | Deployment | vercel.json, CI/CD |

---

## Prerequisites Before Starting

1. **Node.js 18+** installed
2. **Docker Desktop** for local database
3. **Git** initialized with remote repository
4. **VS Code** or preferred editor

## Commands to Run Before Each Commit

```bash
# Format code
npm run format

# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Commit
git add .
git commit -m "commit message"
```

---

**Next Phase:** Phase 2 - Admin Event Management (Week 2)
