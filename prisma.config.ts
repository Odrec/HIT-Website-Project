import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://hit_user:hit_password@localhost:5432/hit_db',
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
})
