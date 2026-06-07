#!/usr/bin/env node
// Phase 0 probe — confirm Sideshift's real response shapes before we build the
// adapter against them. Read-only. Saves raw responses as fixtures so Phase 1
// has real data to parse and seed raw_ingest from.
//
// Run:  node --env-file=.env.local scripts/probe-sideshift.mjs
//
// Needs in .env.local:
//   SIDESHIFT_API_KEY=...            (a real brand/program API key)
//   SIDESHIFT_BASE_URL=...           (e.g. https://api.sideshift.io  — no trailing /)
//   SIDESHIFT_AUTH_HEADER=Authorization   (optional; default Authorization)
//   SIDESHIFT_AUTH_SCHEME=Bearer          (optional; default "Bearer ", set "" for raw key)
//
// What it does, and what it answers from the brief:
//   1. GET /programs?status=active                  -> list active campaigns
//   2. GET /analytics/overview?programId=<first>    -> the per-campaign board shape
//   3. Re-hit /analytics/overview with candidate date-range params -> does any work?
//   4. Print a shape summary: is topCreators[].id present? is handles[] present?
//   5. Save every raw response to fixtures/sideshift/*.json

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "fixtures", "sideshift");

const KEY = process.env.SIDESHIFT_API_KEY;
const BASE = (process.env.SIDESHIFT_BASE_URL || "").replace(/\/+$/, "");
const AUTH_HEADER = process.env.SIDESHIFT_AUTH_HEADER || "Authorization";
const AUTH_SCHEME = process.env.SIDESHIFT_AUTH_SCHEME ?? "Bearer ";

function die(msg) {
  console.error(`\n  ✖ ${msg}\n`);
  process.exit(1);
}
if (!KEY) die("SIDESHIFT_API_KEY missing. Put it in .env.local.");
if (!BASE) die("SIDESHIFT_BASE_URL missing. Put it in .env.local (e.g. https://api.sideshift.io).");

const headers = { [AUTH_HEADER]: `${AUTH_SCHEME}${KEY}`, accept: "application/json" };

async function get(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw text */ }
  return { url, status: res.status, ok: res.ok, json, text };
}

async function save(name, data) {
  await mkdir(FIXTURES, { recursive: true });
  const file = join(FIXTURES, `${name}.json`);
  await writeFile(file, JSON.stringify(data, null, 2));
  console.log(`    saved fixtures/sideshift/${name}.json`);
}

// Pull a likely "list of items" out of an unknown response envelope.
function asArray(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const k of ["data", "programs", "items", "results", "topCreators", "creators"]) {
      if (Array.isArray(json[k])) return json[k];
    }
  }
  return [];
}

function keysOf(obj) {
  return obj && typeof obj === "object" ? Object.keys(obj) : [];
}

console.log(`\n  Sideshift probe → ${BASE}`);
console.log(`  auth: ${AUTH_HEADER}: ${AUTH_SCHEME ? AUTH_SCHEME.trim() + " " : ""}<key…${KEY.slice(-4)}>\n`);

// ── 1. Active programs ────────────────────────────────────────────────────
console.log("  [1] GET /programs?status=active");
const programs = await get("/programs?status=active");
console.log(`      → ${programs.status}`);
if (!programs.ok) {
  await save("programs_active_ERROR", { request: "/programs?status=active", ...programs });
  die(`/programs returned ${programs.status}. Body:\n${programs.text.slice(0, 600)}\n\n` +
      `If 401/403: check SIDESHIFT_AUTH_HEADER / SIDESHIFT_AUTH_SCHEME (try x-api-key, or scheme "").\n` +
      `If 404: the base URL or path is wrong — confirm the real endpoint.`);
}
await save("programs_active", programs.json ?? programs.text);
const programList = asArray(programs.json);
console.log(`      top-level keys: [${keysOf(programs.json).join(", ")}]`);
console.log(`      program count: ${programList.length}`);
if (programList[0]) console.log(`      program[0] keys: [${keysOf(programList[0]).join(", ")}]`);

// figure out a program id field
const first = programList[0] || {};
const programId = first.id ?? first.programId ?? first.externalId ?? first.program_id;
if (!programId) {
  console.log("\n  ⚠ Could not find a program id on program[0]. Inspect the fixture and tell me the field name.");
  process.exit(0);
}
console.log(`      using programId = ${programId}\n`);

// ── 2. Analytics overview (the per-campaign board) ────────────────────────
console.log(`  [2] GET /analytics/overview?programId=${programId}`);
const overview = await get(`/analytics/overview?programId=${encodeURIComponent(programId)}`);
console.log(`      → ${overview.status}`);
await save("analytics_overview", overview.json ?? overview.text);
if (overview.ok && overview.json) {
  const o = overview.json;
  console.log(`      top-level keys: [${keysOf(o).join(", ")}]`);
  const tc = o.topCreators ?? o.creators ?? asArray(o);
  if (Array.isArray(tc) && tc[0]) {
    console.log(`      topCreators[0] keys: [${keysOf(tc[0]).join(", ")}]`);
    console.log(`      ✓ topCreators[].id present?  ${"id" in tc[0] ? "YES" : "NO — found: " + keysOf(tc[0]).join("/")}`);
    const h = tc[0].handles ?? tc[0].accounts;
    console.log(`      ✓ handles[] present?         ${Array.isArray(h) ? `YES (${h.length})` : "NO"}`);
    if (Array.isArray(h) && h[0]) console.log(`      handles[0] keys: [${keysOf(h[0]).join(", ")}]`);
  } else {
    console.log("      ⚠ no topCreators/creators array found — inspect fixture.");
  }
} else {
  console.log(`      body: ${overview.text.slice(0, 400)}`);
}
console.log("");

// ── 3. Date-range param probe ─────────────────────────────────────────────
// The brief's one open question: does /analytics/overview accept a date range?
// Try common param pairs; a 200 whose payload differs from the no-range call
// suggests it's honoured. We compare a cheap fingerprint (lifetime view total).
console.log("  [3] Date-range param probe on /analytics/overview");
function fingerprint(json) {
  const tc = json?.topCreators ?? json?.creators ?? asArray(json);
  if (!Array.isArray(tc)) return "n/a";
  let sum = 0;
  for (const c of tc) sum += Number(c.views ?? c.lifetimeViews ?? c.totalViews ?? 0) || 0;
  return `${tc.length} creators / Σviews=${sum}`;
}
const baseFp = overview.ok ? fingerprint(overview.json) : "n/a";
console.log(`      baseline (no range): ${baseFp}`);
const candidates = [
  ["from", "to"],
  ["startDate", "endDate"],
  ["start", "end"],
  ["since", "until"],
  ["dateFrom", "dateTo"],
  ["periodStart", "periodEnd"],
];
const from = "2026-05-01";
const to = "2026-05-31";
const accepted = [];
for (const [a, b] of candidates) {
  const r = await get(`/analytics/overview?programId=${encodeURIComponent(programId)}&${a}=${from}&${b}=${to}`);
  const fp = r.ok ? fingerprint(r.json) : `HTTP ${r.status}`;
  const differs = r.ok && fp !== baseFp;
  console.log(`      ${a}/${b}: ${r.status}${differs ? "  ← payload DIFFERS (likely honoured)" : ""}  [${fp}]`);
  if (r.ok) accepted.push({ params: `${a}/${b}`, differs, fingerprint: fp });
}
await save("date_range_probe", { baseline: baseFp, from, to, accepted });

console.log("\n  ── Phase 0 summary ──");
const honoured = accepted.filter((x) => x.differs);
if (honoured.length) {
  console.log(`  • /analytics/overview DOES accept a date range: ${honoured.map((h) => h.params).join(", ")}`);
  console.log("    (Noted — may simplify windows. Snapshots stay regardless.)");
} else if (accepted.length) {
  console.log("  • Date-range params are accepted (200) but don't change the payload → treat as lifetime-only.");
} else {
  console.log("  • No date-range param accepted → lifetime totals only; windows come from snapshot subtraction.");
}
console.log("  • Fixtures written to fixtures/sideshift/. Phase 1 will load these into raw_ingest.\n");
