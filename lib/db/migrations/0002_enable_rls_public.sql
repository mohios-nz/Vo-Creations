-- Custom SQL migration file, put your code below! --

-- Enable Row Level Security on every public table, with NO policies.
--
-- Why: Supabase exposes a PostgREST data API authenticated by the PUBLIC anon key.
-- With RLS disabled, anyone with the anon key (it ships to the browser) can read/write
-- these tables directly via https://<ref>.supabase.co/rest/v1/<table>. The app does NOT
-- use that API — all data access is Drizzle over the direct/pooled Postgres connection,
-- which connects as the `postgres` role (rolbypassrls = true) and therefore bypasses RLS.
--
-- RLS enabled + zero policies = deny-all for the `anon` / `authenticated` PostgREST roles,
-- while the app's Drizzle path is unaffected. No FORCE (the bypassrls role stays exempt).
-- See docs/DECISIONS.md (topic: security).

ALTER TABLE "creators"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_creators"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "snapshots"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "raw_ingest"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_runs"         ENABLE ROW LEVEL SECURITY;
