import type { Config } from "drizzle-kit";

// Migrations run against the DIRECT connection (port 5432), not the pooler,
// because drizzle-kit needs DDL + prepared statements. The Vercel→Supabase
// integration injects this as POSTGRES_URL_NON_POOLING. At runtime the app uses
// the pooled POSTGRES_URL instead (see lib/db/client.ts).
export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_DIRECT ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL ||
      "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
