import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Use DATABASE_URL from environment, no fallback to force explicit configuration
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL not set, using default for development')
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  ...(databaseUrl
    ? {
        datasource: {
          url: databaseUrl,
        },
      }
    : {}),
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
})
