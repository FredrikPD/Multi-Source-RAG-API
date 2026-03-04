import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma configuration file and database connection
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});