// prisma.config.ts (in project root)
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // This is the URL Prisma CLI (migrate, db push, etc.) will use.
    // For SQLite with adapter-better-sqlite3, this should match your file.
    url: env('DATABASE_URL'),
  },
});