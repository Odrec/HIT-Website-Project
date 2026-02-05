import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Use DATABASE_URL from environment with fallback for dev/CI
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db'

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
})
