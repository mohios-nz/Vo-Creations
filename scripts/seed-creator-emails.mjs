#!/usr/bin/env node
// Seed creator login emails from the consolidated agency CSV (Phase 3 magic-link auth).
//
//   node --env-file=.env.local scripts/seed-creator-emails.mjs [file.csv] [--apply]
//   (default file: active-creators-consolidated.csv — KEEP IT GITIGNORED, never commit)
//
// CSV columns:
//   email_primary  → creators.email       (falls back to a plain `email` column)
//   email_alt      → creators.alt_email    (login-eligible — DECISIONS leaderboard-access)
// plus ONE identifier (first match wins): external_id (Sideshift userId) | handle | name
//
// Dry-run by default (prints what WOULD change + anything unmatched/ambiguous).
// Pass --apply to write. Case-insensitive; values trimmed; handle ignores a leading "@".

import { readFile } from "node:fs/promises";
import postgres from "postgres";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const file = args.find((a) => !a.startsWith("--")) || "active-creators-consolidated.csv";

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

const norm = (v) => (v || "").trim();
const lc = (v) => norm(v).toLowerCase();
const sql = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL, { prepare: false });

async function findCreator(row) {
  const sel = (where) => sql`select id, name, email, alt_email from creators where ${where}`;
  if (row.external_id) {
    const r = await sel(sql`external_id = ${row.external_id}`);
    return r.length === 1 ? { creator: r[0], by: "external_id" } : { ambiguous: r.length > 1, by: "external_id" };
  }
  if (row.handle) {
    const h = row.handle.replace(/^@/, "");
    const r = await sql`select distinct c.id, c.name, c.email, c.alt_email from campaign_accounts a
      join creators c on c.id = a.creator_id where lower(a.handle) = lower(${h})`;
    return r.length === 1 ? { creator: r[0], by: "handle" } : { ambiguous: r.length > 1, by: "handle" };
  }
  if (row.name) {
    const r = await sel(sql`lower(name) = lower(${row.name})`);
    return r.length === 1 ? { creator: r[0], by: "name" } : { ambiguous: r.length > 1, by: "name" };
  }
  return { creator: null, by: "none" };
}

const rows = parseCsv(await readFile(file, "utf8"));
console.log(`\n  ${rows.length} rows from ${file} · mode: ${APPLY ? "APPLY" : "dry-run"}\n`);

let updated = 0;
const unmatched = [];
for (const row of rows) {
  const email = norm(row.email_primary || row.email);
  const altEmail = norm(row.email_alt) || null;
  if (!email && !altEmail) { unmatched.push({ row, reason: "no email_primary/email_alt value" }); continue; }

  const { creator, ambiguous, by } = await findCreator(row);
  if (!creator) {
    unmatched.push({ row, reason: ambiguous ? `ambiguous by ${by}` : `no match by ${by}` });
    continue;
  }

  const same = lc(creator.email) === lc(email) && lc(creator.alt_email) === lc(altEmail);
  console.log(`  ${same ? "=" : "→"} ${creator.name.padEnd(24)} ${creator.email || "(none)"}/${creator.alt_email || "(none)"} ${same ? "" : `⇒ ${email || "(none)"}/${altEmail || "(none)"}`}  [${by}]`);
  if (!same) {
    if (APPLY) {
      await sql`update creators set email = ${email || null}, alt_email = ${altEmail}, updated_at = now() where id = ${creator.id}`;
    }
    updated++;
  }
}

console.log(`\n  ${APPLY ? "updated" : "would update"}: ${updated} · unmatched: ${unmatched.length}`);
for (const u of unmatched) console.log(`    ✗ ${JSON.stringify(u.row)} — ${u.reason}`);
if (!APPLY && updated) console.log("\n  Re-run with --apply to write.\n");
await sql.end();
