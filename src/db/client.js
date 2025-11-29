import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  // Mirrors DATABASE_URL / prisma.config.ts settings.
  url: process.env.DATABASE_URL || "file:./dev.db",
});

export const prisma = new PrismaClient({ adapter });
