// Drizzle client — the single DB handle for the whole app.
// Every product reads/writes through this; never instantiate postgres() elsewhere.
//
// Connection comes from the Vercel→Supabase integration, which injects POSTGRES_*.
// At runtime we use the *pooled* string (POSTGRES_URL — port 6543, "Transaction"
// pooler) so serverless lambdas don't exhaust Postgres connections. Migrations
// (drizzle-kit) use the direct/non-pooling URL instead — see drizzle.config.ts.
// DATABASE_URL is honoured as an override if ever set manually.
//
// LAZY: the connection is created on first use, not at import. `next build`
// imports route modules to collect page data (even force-dynamic ones), and CI
// builds run without env — so connecting at import time would throw at build.
// Connecting lazily means the missing-env error only surfaces at request time,
// where it belongs.

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let queryClient: ReturnType<typeof postgres> | null = null;
let instance: PostgresJsDatabase<typeof schema> | null = null;

function init(): PostgresJsDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "No DB connection string — set POSTGRES_URL (via `vercel env pull`) or DATABASE_URL."
    );
  }
  // `prepare: false` is required by Supabase's transaction-mode pooler (pgbouncer),
  // which does not support prepared statements.
  queryClient = postgres(connectionString, { prepare: false });
  return drizzle(queryClient, { schema });
}

/** Get the shared Drizzle client, initialising it on first call. */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!instance) instance = init();
  return instance;
}

/** Close the pooled connection. For test teardown / scripts only — serverless
 *  never calls this (the lambda is frozen between invocations, not torn down).
 *  Without it, a one-off process (like the leaderboard test) leaks an open handle
 *  and never exits. */
export async function closeDb(): Promise<void> {
  await queryClient?.end({ timeout: 5 });
  queryClient = null;
  instance = null;
}

// Convenience handle: `db.insert(...)` works as before, but the underlying
// connection is created lazily on first property access (see LAZY note above).
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
