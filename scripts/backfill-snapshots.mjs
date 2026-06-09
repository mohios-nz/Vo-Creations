#!/usr/bin/env node
// Historic snapshot backfill — lights up the 7d/30d boards from CSV history.
//
//   node --env-file=.env.local scripts/backfill-snapshots.mjs --dir "<folder>" [--apply]
//   node --env-file=.env.local scripts/backfill-snapshots.mjs <backfill.csv> <handles.csv> [--apply]
//
// Inputs (gitignored — PII):
//   backfill-input.csv:      date, brand, creator, daily_views, lifetime_views, videos
//   handles-by-campaign.csv: brand, creator, platform, handle, first_seen, last_seen
//
// Rules:
//  - APPEND-ONLY: insert ... on conflict (snapshot_date, program_id, creator_id) DO NOTHING.
//    The live cron's rows are authoritative for overlapping dates; the CSV only fills the
//    history before them.
//  - Brand → program: reuse an existing program if the name matches (so Allinmotion's
//    backfill shares program_id with the live data → no seam); else create one
//    (source 'backfill', status 'ended').
//  - Creator → creator_id: match by HANDLE (handles-by-campaign → campaign_accounts), then
//    by NAME; unmatched creators are CREATED (source 'backfill'), deduped by name so one
//    human rolls up across brands. Nothing is fuzzy-guessed onto the wrong existing row.
//  - handles-by-campaign also enriches campaign_accounts (platform/handle per brand+creator).
//  - DRY-RUN by default: prints the full report. --apply writes, then logs sync_runs + the
//    raw CSVs into raw_ingest.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const dirIdx = argv.indexOf("--dir");
let backfillPath, handlesPath;
if (dirIdx >= 0) {
  const dir = argv[dirIdx + 1];
  backfillPath = join(dir, "backfill-input.csv");
  handlesPath = join(dir, "handles-by-campaign.csv");
} else {
  [backfillPath, handlesPath] = argv.filter((a) => !a.startsWith("--"));
}
if (!backfillPath || !handlesPath) {
  console.error('usage: backfill-snapshots.mjs --dir "<folder>" [--apply]  (or <backfill.csv> <handles.csv>)');
  process.exit(1);
}

// ── tiny RFC4180-ish CSV parser (handles quoted fields + commas + "") ─────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");      // brand/name compare
const normHandle = (s) => (s || "").toLowerCase().replace(/^@/, "").trim();
const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toInt = (s) => { const n = parseInt(String(s).replace(/[, ]/g, ""), 10); return Number.isFinite(n) ? n : 0; };
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// Use the DIRECT connection (no pgbouncer) — this bulk transaction has too many
// statements for the transaction-mode pooler (it closes the connection mid-run).
const conn = process.env.DATABASE_URL_DIRECT || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(conn, { prepare: false, idle_timeout: 30, connect_timeout: 30 });

// ── load inputs + current DB ──────────────────────────────────────────────────
const backfillRaw = await readFile(backfillPath, "utf8");
const handlesRaw = await readFile(handlesPath, "utf8");
const backfill = parseCsv(backfillRaw);
const handlesCsv = parseCsv(handlesRaw);

// Master human list (active-creators-consolidated.csv) for dedup by normalized name.
// One human = one creator_id across backfill + live + seed: on a name match we create the
// row under the master's CANONICAL name so the later email seed (which reads the same file)
// converges on this exact row. Look in --master, then the data dir, then its parent.
const masterIdx = argv.indexOf("--master");
let masterPath = masterIdx >= 0 ? argv[masterIdx + 1] : null;
if (!masterPath && dirIdx >= 0) {
  for (const cand of [join(argv[dirIdx + 1], "active-creators-consolidated.csv"),
                      join(argv[dirIdx + 1], "..", "active-creators-consolidated.csv")]) {
    if (existsSync(cand)) { masterPath = cand; break; }
  }
}
if (!masterPath || !existsSync(masterPath)) {
  console.error("✖ active-creators-consolidated.csv not found (condition A: human dedup). Pass --master <path>.");
  process.exit(1);
}
const masterByName = new Map(); // normName → canonical name
for (const m of parseCsv(await readFile(masterPath, "utf8"))) {
  const nm = norm(m.name);
  if (nm) masterByName.set(nm, m.name);
}

const dbProgs = await sql`select id, name, company_name from programs`;
const dbCreators = await sql`select id, name from creators`;
const dbAccounts = await sql`select creator_id, platform, handle from campaign_accounts`;

// handle → existing creator_id
const handleToCreator = new Map();
for (const a of dbAccounts) handleToCreator.set(normHandle(a.handle), a.creator_id);
// name → existing creator_id (drop ambiguous names)
const nameToCreator = new Map();
const nameSeen = new Map();
for (const c of dbCreators) {
  const k = norm(c.name);
  nameSeen.set(k, (nameSeen.get(k) || 0) + 1);
  nameToCreator.set(k, c.id);
}
for (const [k, n] of nameSeen) if (n > 1) nameToCreator.delete(k);

// (brand,creator) → [handles] from handles-by-campaign
const handlesByBC = new Map();
for (const h of handlesCsv) {
  const key = norm(h.brand) + "|" + norm(h.creator);
  if (!handlesByBC.has(key)) handlesByBC.set(key, []);
  handlesByBC.get(key).push({ platform: (h.platform || "").toLowerCase(), handle: normHandle(h.handle) });
}

// ── resolve brands → programs ─────────────────────────────────────────────────
const brands = [...new Set(backfill.map((r) => r.brand).filter(Boolean))];
const brandPlan = new Map(); // brand → { action:'match'|'create', programName, id? }
for (const brand of brands) {
  const nb = norm(brand);
  const hit = dbProgs.find((p) => {
    const np = norm(p.name), nc = norm(p.company_name);
    return np === nb || nc === nb || np.includes(nb) || nb.includes(np);
  });
  brandPlan.set(brand, hit
    ? { action: "match", programName: hit.name, id: hit.id }
    : { action: "create", programName: brand, externalId: "backfill:" + slug(brand) });
}

// ── resolve creators → creator_id ─────────────────────────────────────────────
const creatorKeys = [...new Set(backfill.map((r) => norm(r.creator)).filter(Boolean))];
const creatorPlan = new Map(); // normCreator → { action, by, id?, name, externalId?, inMaster? }
const byHandle = [], byName = [], createdInMaster = [], createdNetNew = [];
for (const r of backfill) {
  const nc = norm(r.creator);
  if (!nc || creatorPlan.has(nc)) continue;
  // 1. reuse an EXISTING creator row (handle, then name) — avoids duplicating a live human
  let id = null, by = null;
  const handles = handlesByBC.get(norm(r.brand) + "|" + nc) || [];
  for (const h of handles) { if (handleToCreator.has(h.handle)) { id = handleToCreator.get(h.handle); by = "handle"; break; } }
  if (!id && nameToCreator.has(nc)) { id = nameToCreator.get(nc); by = "name"; }
  if (id) {
    creatorPlan.set(nc, { action: "match", by, id, name: r.creator });
    (by === "handle" ? byHandle : byName).push(r.creator);
    continue;
  }
  // 2. CREATE — but dedup against the master human list (condition A). On a normalized-name
  //    match, use the master's canonical name so the email seed converges on this row.
  const canonical = masterByName.get(nc);
  creatorPlan.set(nc, {
    action: "create", inMaster: !!canonical,
    name: canonical || r.creator,
    externalId: "backfill:" + slug(canonical || r.creator),
  });
  (canonical ? createdInMaster : createdNetNew).push(canonical || r.creator);
}

// ── build snapshot rows (dedup (date,brand,creator); keep max lifetime) ────────
const snapKey = (d, b, c) => `${d}|${norm(b)}|${norm(c)}`;
const snapRows = new Map();
const badRows = [];
for (const r of backfill) {
  if (!isDate(r.date) || !r.brand || !r.creator) { badRows.push(r); continue; }
  const k = snapKey(r.date, r.brand, r.creator);
  const lifetime = toInt(r.lifetime_views);
  const prev = snapRows.get(k);
  if (!prev || lifetime > prev.lifetime) {
    snapRows.set(k, { date: r.date, brand: r.brand, creator: r.creator, lifetime, videos: toInt(r.videos) });
  }
}

// per-brand date coverage
const coverage = new Map();
for (const s of snapRows.values()) {
  const c = coverage.get(s.brand) || { min: s.date, max: s.date, dates: new Set(), creators: new Set() };
  if (s.date < c.min) c.min = s.date; if (s.date > c.max) c.max = s.date;
  c.dates.add(s.date); c.creators.add(norm(s.creator));
  coverage.set(s.brand, c);
}

// ── DRY-RUN REPORT ─────────────────────────────────────────────────────────────
const dates = [...new Set([...snapRows.values()].map((s) => s.date))].sort();
console.log(`\n══ BACKFILL ${APPLY ? "APPLY" : "DRY-RUN"} ══`);
console.log(`inputs: ${backfill.length} backfill rows, ${handlesCsv.length} handle rows`);
console.log(`date range: ${dates[0]} .. ${dates[dates.length - 1]}  (${dates.length} distinct dates)`);

console.log(`\nBRANDS (${brands.length}):`);
const bMatch = [...brandPlan].filter(([, p]) => p.action === "match");
const bCreate = [...brandPlan].filter(([, p]) => p.action === "create");
console.log(`  matched to existing program (${bMatch.length}):`);
for (const [b, p] of bMatch) console.log(`    "${b}" → ${p.programName}`);
console.log(`  WOULD CREATE program (${bCreate.length}): ${bCreate.map(([b]) => b).join(", ")}`);

console.log(`\nCREATORS (${creatorKeys.length} distinct):`);
console.log(`  reuse existing DB creator — by handle: ${byHandle.length} | by name: ${byName.length}`);
console.log(`  CREATE, matched master list (${createdInMaster.length}) → seed will converge by name`);
console.log(`  CREATE, NET-NEW not in master (${createdNetNew.length}): ${createdNetNew.slice(0, 40).join(", ")}${createdNetNew.length > 40 ? " …" : ""}`);

console.log(`\nSNAPSHOT ROWS: ${snapRows.size} unique (date,brand,creator)` + (badRows.length ? `  ·  ${badRows.length} skipped (bad date/brand/creator)` : ""));
console.log(`  per-brand coverage (brand: dates min..max, #dates, #creators):`);
for (const [b, c] of [...coverage].sort()) console.log(`    ${b}: ${c.min}..${c.max}  ${c.dates.size}d  ${c.creators.size} creators`);

// estimate conflicts with existing snapshots (so "rows to write" is honest)
const existing = await sql`select snapshot_date::text d, program_id from snapshots`;
const existingProgIds = new Set(existing.map((e) => e.program_id));
let estConflicts = 0;
for (const s of snapRows.values()) {
  const p = brandPlan.get(s.brand);
  if (p?.action === "match" && existingProgIds.has(p.id)) {
    if (existing.some((e) => e.program_id === p.id && e.d === s.date)) estConflicts++;
  }
}
console.log(`\n  rows to write (append-only): ~${snapRows.size - estConflicts}  (≈${estConflicts} overlap existing live dates → left untouched)`);

if (!APPLY) {
  console.log(`\nDry-run only. Review the above, then re-run with --apply.\n`);
  await sql.end();
  process.exit(0);
}

// ── APPLY (transactional) ──────────────────────────────────────────────────────
console.log(`\nApplying…`);
let programsTouched = 0, creatorsCreated = 0, rowsWritten = 0, accountsWritten = 0;
const programId = new Map();   // brand → program uuid
const creatorId = new Map();   // normCreator → creator uuid

const chunked = async (tx, rows, cols, sqlText) => {
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const res = await sqlText(tx, rows.slice(i, i + 500));
    n += res.count ?? 0;
  }
  return n;
};

await sql.begin(async (tx) => {
  // programs — matched reuse existing id; created are batch-inserted, mapped by external_id
  const progCreate = [];
  for (const [brand, p] of brandPlan) {
    if (p.action === "match") programId.set(brand, p.id);
    else progCreate.push({ source: "backfill", external_id: p.externalId, name: brand, status: "ended", _brand: brand });
  }
  if (progCreate.length) {
    const ret = await tx`insert into programs ${tx(progCreate, "source", "external_id", "name", "status")}
      on conflict (source, external_id) do update set name = excluded.name returning id, external_id`;
    const byExt = new Map(ret.map((r) => [r.external_id, r.id]));
    for (const p of progCreate) { programId.set(p._brand, byExt.get(p.external_id)); programsTouched++; }
  }
  // creators — same pattern
  const credCreate = [];
  for (const [nc, p] of creatorPlan) {
    if (p.action === "match") creatorId.set(nc, p.id);
    else credCreate.push({
      source: "backfill", external_id: p.externalId, name: p.name,
      notes: p.inMaster ? "backfill: in master list" : "backfill: net-new (not in master list)", _nc: nc,
    });
  }
  if (credCreate.length) {
    const ret = await tx`insert into creators ${tx(credCreate, "source", "external_id", "name", "notes")}
      on conflict (source, external_id) do update set name = excluded.name returning id, external_id`;
    const byExt = new Map(ret.map((r) => [r.external_id, r.id]));
    for (const p of credCreate) { creatorId.set(p._nc, byExt.get(p.external_id)); creatorsCreated++; }
  }

  // campaign_accounts (dedup, batched)
  const acctSeen = new Set(), acctRows = [];
  for (const h of handlesCsv) {
    const pid = programId.get(h.brand), cid = creatorId.get(norm(h.creator));
    const platform = (h.platform || "").toLowerCase(), handle = normHandle(h.handle);
    if (!pid || !cid || !platform || !handle) continue;
    const k = `${pid}|${cid}|${platform}|${handle}`;
    if (acctSeen.has(k)) continue; acctSeen.add(k);
    acctRows.push({ program_id: pid, creator_id: cid, platform, handle });
  }
  accountsWritten = await chunked(tx, acctRows, null, (t, c) =>
    t`insert into campaign_accounts ${t(c, "program_id", "creator_id", "platform", "handle")}
      on conflict (program_id, creator_id, platform, handle) do nothing`);

  // program_creators — participation from snapshots (batched)
  const partSeen = new Set(), partRows = [];
  for (const s of snapRows.values()) {
    const pid = programId.get(s.brand), cid = creatorId.get(norm(s.creator));
    if (!pid || !cid) continue;
    const k = `${pid}|${cid}`; if (partSeen.has(k)) continue; partSeen.add(k);
    partRows.push({ program_id: pid, creator_id: cid, status: "active" });
  }
  await chunked(tx, partRows, null, (t, c) =>
    t`insert into program_creators ${t(c, "program_id", "creator_id", "status")}
      on conflict (program_id, creator_id) do nothing`);

  // snapshots (append-only, batched)
  const values = [];
  for (const s of snapRows.values()) {
    const pid = programId.get(s.brand), cid = creatorId.get(norm(s.creator));
    if (pid && cid) values.push({ snapshot_date: s.date, program_id: pid, creator_id: cid, lifetime_views: s.lifetime, lifetime_posts: s.videos });
  }
  rowsWritten = await chunked(tx, values, null, (t, c) =>
    t`insert into snapshots ${t(c, "snapshot_date", "program_id", "creator_id", "lifetime_views", "lifetime_posts")}
      on conflict (snapshot_date, program_id, creator_id) do nothing`);
  // raw_ingest (immutable) — store the CSVs
  await tx`insert into raw_ingest (source, endpoint, payload) values
    ('backfill', 'backfill-input.csv', ${sql.json({ csv: backfillRaw.slice(0, 5_000_000) })}),
    ('backfill', 'handles-by-campaign.csv', ${sql.json({ csv: handlesRaw.slice(0, 5_000_000) })})`;
  // sync_runs log
  await tx`insert into sync_runs (source, finished_at, status, programs_synced, rows_written, warnings)
    values ('backfill', now(), 'ok', ${programId.size}, ${rowsWritten},
      ${sql.json({ programsCreated: programsTouched, creatorsCreated, accountsWritten, snapshotRowsAttempted: values.length })})`;
});

console.log(`done: programs created ${programsTouched}, creators created ${creatorsCreated}, campaign_accounts +${accountsWritten}, snapshot rows written ${rowsWritten} (append-only).`);
await sql.end();
