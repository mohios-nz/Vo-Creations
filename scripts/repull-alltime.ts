#!/usr/bin/env node
// One-time AUTHORITATIVE all-time repull + re-key/re-anchor.  DRY-RUN by default.
//
//   node --env-file=.env.local --import tsx scripts/repull-alltime.ts [--master <csv>] [--apply]
//
// WHY: all-time totals were rebuilt by summing date-windowed per-video CSVs, which omit
// older videos/campaigns → 6–96% undercount per creator (Kiera 13.4M vs ~28.6M; Casey
// missing). The FIX is to read the SOURCE of truth — Sideshift's per-program lifetime
// `topCreators[]` — across EVERY brand key (SIDESHIFT_KEYS) and EVERY program (active AND
// archived), grouped by the stable creator uid. See docs/DECISIONS.md topic: alltime-repull.
//
// What it does (all printed in the dry-run; nothing is written without --apply):
//   1. AUTHORITATIVE all-time  = Σ topCreators.totalViews per stable uid, across all programs.
//   2. RE-KEY plan             = bridge each authoritative uid to the existing DB creator that
//      the CSV backfill created under a SYNTHETIC id ("backfill:kiera-par"). Bridge order:
//        (a) DB creator already keyed to the real uid  → nothing to do
//        (b) master roster CSV external_id == uid      → exact canonical-name row (seed-convergent)
//        (c) handle: API roster handle → campaign_accounts.creator_id
//        (d) name : API display name → DB creator via the tolerant matcher (lib/ingest/match)
//      Ghost/ambiguous/unmatched are HELD for manual review — never force-matched, never
//      auto-duplicated. Programs get the same treatment (backfill program → real id by name).
//   3. ANCHOR  = write the API total as lifetime_views at each (program,creator)'s latest
//      snapshot date, and RE-ANCHOR the backfill series (scale to that total) so the 7/30-day
//      SHAPE is preserved with the correct absolute level. Irreconcilable series are reported.
//
// Requires the real brand keys (SIDESHIFT_KEYS) to see brands beyond the single-key company,
// and the master roster CSV (active-creators-consolidated.csv, gitignored) for the (b) bridge.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { fetchAllPrograms, configKeys } from "../lib/ingest/sideshift";
import { buildNameIndex, matchName, isGhostName, nameKey } from "../lib/ingest/match";
import type { NormalizedProgramData } from "../lib/ingest/types";

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const masterPath = (() => {
  const i = argv.indexOf("--master");
  return i >= 0 ? argv[i + 1] : "active-creators-consolidated.csv";
})();
const n = (x: number) => x.toLocaleString("en-US");
const pct = (a: number, b: number) => (b === 0 ? "—" : `${(((a - b) / b) * 100).toFixed(0)}%`);
const normBrand = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const normHandle = (s: string) => (s || "").toLowerCase().replace(/^@/, "").trim();

// ── tiny CSV parser (quoted fields) ─────────────────────────────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; } }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// ── connect (DIRECT — bulk mutation, like the backfill tool) ────────────────────
const conn = process.env.DATABASE_URL_DIRECT || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(conn!, { prepare: false, idle_timeout: 30, connect_timeout: 30 });

async function main() {
  console.log(`\n══ ALL-TIME REPULL ${APPLY ? "APPLY" : "DRY-RUN"} ══`);
  const keys = configKeys();
  console.log(`brand keys (SIDESHIFT_KEYS/SIDESHIFT_API_KEY): ${keys.length}${keys.some((k) => k.label) ? " (JSON map)" : " (flat list)"}`);

  // ── 1. AUTHORITATIVE all-time from the API (all keys × active+ended) ──────────
  const { data: programData, coverage } = await fetchAllPrograms({ statuses: ["active", "ended"] });
  console.log(`programs pulled: ${programData.length} (active + archived across all keys)`);
  console.log(`── PER-KEY COVERAGE (a 0-program/0-creator key = dead or wrong key) ──`);
  for (const c of coverage) {
    console.log(`    ${(c.label ?? "(unlabeled)").padEnd(22)} programs ${String(c.programs).padStart(3)} · creators ${String(c.creators).padStart(4)} · views ${n(c.views).padStart(14)}`);
  }

  type Authoritative = { uid: string; name: string; views: number; posts: number; programs: { ext: string; name: string; views: number; posts: number }[] };
  const byUid = new Map<string, Authoritative>();
  // uid → handles seen on the API roster (for the handle bridge)
  const handlesByUid = new Map<string, Set<string>>();
  for (const d of programData) {
    for (const m of d.metrics) {
      const a = byUid.get(m.externalId) ?? { uid: m.externalId, name: m.name, views: 0, posts: 0, programs: [] };
      a.views += m.lifetimeViews; a.posts += m.lifetimePosts;
      a.programs.push({ ext: d.program.externalId, name: d.program.name, views: m.lifetimeViews, posts: m.lifetimePosts });
      byUid.set(m.externalId, a);
    }
    for (const r of d.roster) {
      const set = handlesByUid.get(r.externalId) ?? new Set<string>();
      for (const acc of r.accounts) set.add(normHandle(acc.handle));
      handlesByUid.set(r.externalId, set);
    }
  }
  const authoritative = Array.from(byUid.values()).sort((x, y) => y.views - x.views);
  if (!authoritative.length) {
    console.log("\n⚠ No creators returned by the API. With only the single Vo Creations key this is expected for");
    console.log("  brands other than Allinmotion — set SIDESHIFT_KEYS to every brand key and re-run.\n");
  }

  // ── 2. DB current state ───────────────────────────────────────────────────────
  const dbCreators = await sql<{ id: string; source: string; external_id: string; name: string }[]>`
    select id, source, external_id, name from creators`;
  const dbAccounts = await sql<{ creator_id: string; handle: string }[]>`select creator_id, handle from campaign_accounts`;
  const dbProgs = await sql<{ id: string; source: string; external_id: string; name: string; company_name: string | null }[]>`
    select id, source, external_id, name, company_name from programs`;

  const creatorByExternal = new Map(dbCreators.map((c) => [c.external_id, c]));
  const creatorById = new Map(dbCreators.map((c) => [c.id, c]));
  const isBackfillRow = (extId: string) => extId.startsWith("backfill:");

  // BACKFILL-specific indexes (the synthetic rows we merge/re-key away from). Matching the
  // re-key/merge against ONLY backfill rows avoids the cron-created real-uid duplicates.
  const backfillCreators = dbCreators.filter((c) => isBackfillRow(c.external_id));
  const bfNameIndex = buildNameIndex(backfillCreators.map((c) => ({ id: c.id, name: c.name })));
  const bfHandleToId = new Map<string, string>();
  {
    const bfIds = new Set(backfillCreators.map((c) => c.id));
    for (const a of dbAccounts) {
      const h = normHandle(a.handle);
      if (bfIds.has(a.creator_id) && !bfHandleToId.has(h)) bfHandleToId.set(h, a.creator_id);
    }
  }
  // REAL-uid rows grouped by name → detect MULTI-UID humans (≥2 real rows share a name → HOLD).
  const realIdsByNameKey = new Map<string, string[]>();
  for (const c of dbCreators) if (!isBackfillRow(c.external_id)) {
    const k = nameKey(c.name);
    (realIdsByNameKey.get(k) ?? realIdsByNameKey.set(k, []).get(k)!).push(c.id);
  }
  /** find the backfill dup for a human: handle bridge first, then tolerant name. */
  function findBackfill(a: Authoritative): { id: string; via: "handle" | "name"; confidence: string } | { ambiguous: number } | null {
    for (const h of Array.from(handlesByUid.get(a.uid) ?? [])) { const id = bfHandleToId.get(h); if (id) return { id, via: "handle", confidence: "handle" }; }
    const m = matchName(a.name, bfNameIndex);
    if (m.status === "matched") return { id: m.id, via: "name", confidence: m.confidence };
    if (m.status === "ambiguous") return { ambiguous: m.ids.length };
    return null;
  }

  // current DB all-time per creator (mirrors lib/queries/leaderboard allTimeBoard)
  const dbAllTimeRows = await sql<{ creator_id: string; views: string }[]>`
    with latest_pc as (
      select distinct on (s.program_id, s.creator_id) s.program_id, s.creator_id, s.lifetime_views v
      from snapshots s order by s.program_id, s.creator_id, s.snapshot_date desc)
    select creator_id, sum(v)::bigint views from latest_pc group by creator_id`;
  const dbViewsByCreator = new Map(dbAllTimeRows.map((r) => [r.creator_id, Number(r.views)]));

  // ── master roster CSV (bridge b): canonical name + real uid ───────────────────
  let masterByUid = new Map<string, { name: string }>();
  if (existsSync(masterPath)) {
    const master = parseCsv(await readFile(masterPath, "utf8"));
    for (const m of master) {
      const uid = (m.external_id || m.externalid || m.userid || "").trim();
      const nm = (m.name || "").trim();
      if (uid && nm) masterByUid.set(uid, { name: nm });
    }
    console.log(`master roster: ${master.length} rows, ${masterByUid.size} with a real uid (${masterPath})`);
  } else {
    console.log(`master roster: NOT FOUND at ${masterPath} — bridge (b) disabled, using handle/name only.`);
  }

  // ── 3. RESOLVE each authoritative human → ONE canonical real-uid row ───────────
  // CANONICAL = the cron-created real-uid row. MERGE the backfill dup into it (re-point its
  // children, drop the synthetic row); RE-KEY the backfill row when no cron row exists yet.
  // Ghosts and MULTI-UID humans (≥2 real rows share a name) are HELD for manual review — EXCEPT
  // human-confirmed ones below, which ALIAS-MERGE the secondary uid into the canonical row.
  type Plan = {
    a: Authoritative;
    action: "merge" | "rekey" | "already" | "alias-merge" | "held";
    targetId: string | null;     // canonical real-uid creator (anchor/identity home)
    backfillId: string | null;   // backfill row holding the backfill snapshots (== targetId on rekey)
    aliasRowId?: string;         // alias-merge: the SECONDARY real-uid creator row to fold in + alias
    via: "already" | "master-uid" | "handle" | "name" | "confirmed" | null;
    confidence: string;
    held?: "ghost" | "ambiguous" | "unmatched" | "multi-uid";
    note?: string;
  };

  // HUMAN-CONFIRMED multi-uid merges: one person who ended up with 2 real uids (a repurposed
  // handle reused across campaigns). The secondary uid is ALIAS-MERGED into the canonical and
  // recorded in creator_aliases, so the cron routes it forever (it can still appear in
  // topCreators). Extend this list as Danny confirms each case.
  const CONFIRMED_MERGES: { who: string; canonicalUid: string; secondaryUids: string[] }[] = [
    // Johnathan Jen — confirmed ONE human (Danny, 2026-06-11): canonical = higher-history uid.
    { who: "Johnathan Jen", canonicalUid: "0NC7wTNtWfWrFFoZm2eQr6KqdsO2", secondaryUids: ["MwVh3CNRrJPRbBqwkUz31yTh16E3"] },
  ];
  const secondaryToCanonicalUid = new Map<string, string>();
  for (const m of CONFIRMED_MERGES) for (const s of m.secondaryUids) secondaryToCanonicalUid.set(s, m.canonicalUid);
  const confirmedCanonicalUids = new Set(CONFIRMED_MERGES.map((m) => m.canonicalUid));
  // PRE-PASS: a backfill row CONTESTED by ≥2 authoritative uids (e.g. a repurposed handle reused
  // across campaigns by different real humans — see DECISIONS account_repurposing) is ambiguous
  // and must be HELD entirely, never merged/re-keyed onto the wrong human.
  const bfClaims = new Map<string, Set<string>>();
  for (const a of authoritative) {
    if (isGhostName(a.name) || a.uid.startsWith("ghost-")) continue;
    const bf = findBackfill(a);
    if (bf && "id" in bf) (bfClaims.get(bf.id) ?? bfClaims.set(bf.id, new Set()).get(bf.id)!).add(a.uid);
  }
  const contested = (bfId: string | null | undefined) => !!bfId && (bfClaims.get(bfId)?.size ?? 0) >= 2;

  const plans: Plan[] = [];
  for (const a of authoritative) {
    if (isGhostName(a.name) || a.uid.startsWith("ghost-")) {
      plans.push({ a, action: "held", targetId: null, backfillId: null, via: null, confidence: "-", held: "ghost", note: a.uid.startsWith("ghost-") ? `ghost-uid ${a.uid}` : undefined });
      continue;
    }
    // CONFIRMED secondary uid → ALIAS-MERGE into the canonical row (+ record the alias so the cron
    // routes it forever). Skips the multi-uid hold for this human's two real uids.
    const canonUid = secondaryToCanonicalUid.get(a.uid);
    if (canonUid) {
      const canonRow = creatorByExternal.get(canonUid), aliasRow = creatorByExternal.get(a.uid);
      if (canonRow && aliasRow) { plans.push({ a, action: "alias-merge", targetId: canonRow.id, backfillId: null, aliasRowId: aliasRow.id, via: "confirmed", confidence: "alias", note: `secondary → ${canonUid}` }); continue; }
    }
    const realRow = creatorByExternal.get(a.uid); // a row already keyed to this real uid (cron/pre-existing)
    const sameName = realIdsByNameKey.get(nameKey(a.name)) ?? [];
    const isConfirmedCanonical = confirmedCanonicalUids.has(a.uid);

    if (realRow && !isBackfillRow(realRow.external_id)) {
      // canonical exists. HOLD if ≥2 real-uid rows share this name (unless human-confirmed).
      if (sameName.length >= 2 && !isConfirmedCanonical) { plans.push({ a, action: "held", targetId: null, backfillId: null, via: "already", confidence: "-", held: "multi-uid", note: `${sameName.length} real-uid rows share "${a.name}"` }); continue; }
      const bf = findBackfill(a);
      if (bf && "id" in bf && bf.id !== realRow.id) {
        if (contested(bf.id) && !isConfirmedCanonical) { plans.push({ a, action: "held", targetId: null, backfillId: null, via: null, confidence: "-", held: "multi-uid", note: `backfill contested by ${bfClaims.get(bf.id)!.size} uids` }); continue; }
        plans.push({ a, action: "merge", targetId: realRow.id, backfillId: bf.id, via: bf.via, confidence: "merge" }); continue;
      }
      plans.push({ a, action: "already", targetId: realRow.id, backfillId: realRow.id, via: "already", confidence: "exact" }); continue;
    }

    // no canonical yet → RE-KEY a backfill row (bridges: master-uid → handle → name)
    const masterHit = masterByUid.get(a.uid);
    if (masterHit) { const m = matchName(masterHit.name, bfNameIndex); if (m.status === "matched" && !contested(m.id)) { plans.push({ a, action: "rekey", targetId: m.id, backfillId: m.id, via: "master-uid", confidence: m.confidence, note: `master:"${masterHit.name}"` }); continue; } }
    const bf = findBackfill(a);
    if (bf && "id" in bf) {
      if (contested(bf.id)) { plans.push({ a, action: "held", targetId: null, backfillId: null, via: null, confidence: "-", held: "multi-uid", note: `backfill contested by ${bfClaims.get(bf.id)!.size} uids` }); continue; }
      plans.push({ a, action: "rekey", targetId: bf.id, backfillId: bf.id, via: bf.via, confidence: bf.confidence }); continue;
    }
    if (bf && "ambiguous" in bf) { plans.push({ a, action: "held", targetId: null, backfillId: null, via: null, confidence: "-", held: "ambiguous", note: `${bf.ambiguous} backfill rows share this name` }); continue; }
    plans.push({ a, action: "held", targetId: null, backfillId: null, via: null, confidence: "-", held: "unmatched" });
  }

  // ── REPORT: merge + re-key plan ───────────────────────────────────────────────
  const merges = plans.filter((p) => p.action === "merge");
  const aliasMerges = plans.filter((p) => p.action === "alias-merge");
  const reKeys = plans.filter((p) => p.action === "rekey");
  const already = plans.filter((p) => p.action === "already");
  const held = plans.filter((p) => p.action === "held");
  console.log(`\n── IDENTITY PLAN (${authoritative.length} authoritative creators) ──`);
  console.log(`  already canonical: ${already.length} · MERGE backfill→canonical: ${merges.length} · ALIAS-MERGE secondary uid→canonical: ${aliasMerges.length} · RE-KEY: ${reKeys.length} · HELD: ${held.length}`);

  // ALIAS-MERGE: a confirmed second real uid for one human → fold into canonical + record alias
  // (so the cron routes the secondary uid forever; it can still appear in topCreators).
  if (aliasMerges.length) {
    console.log(`\n  ── ALIAS-MERGE (confirmed multi-uid human; secondary real uid → canonical + creator_aliases) ──`);
    for (const p of aliasMerges) {
      const alias = creatorById.get(p.aliasRowId!)!, canon = creatorById.get(p.targetId!)!;
      const aV = dbViewsByCreator.get(p.aliasRowId!) ?? 0, cV = dbViewsByCreator.get(p.targetId!) ?? 0;
      console.log(`    ${p.a.name.slice(0, 18).padEnd(18)} secondary ${alias.external_id} (${n(aV)}v)  →  canonical ${canon.external_id} (${n(cV)}v) + alias`);
    }
  }

  // MERGE pairs: backfill dup → cron real-uid row, with the matching key + side-by-side totals.
  if (merges.length) {
    console.log(`\n  ── MERGE (backfill dup → cron real-uid row) — re-point children, then drop the synthetic row ──`);
    console.log(`    creator                    backfill row              dbViews   →  real uid                       dbViews   key`);
    for (const p of merges) {
      const bf = creatorById.get(p.backfillId!)!, real = creatorById.get(p.targetId!)!;
      const bfV = dbViewsByCreator.get(p.backfillId!) ?? 0, realV = dbViewsByCreator.get(p.targetId!) ?? 0;
      console.log(`    ${p.a.name.slice(0, 24).padEnd(24)} ${bf.external_id.padEnd(22)} ${n(bfV).padStart(10)}  →  ${real.external_id.padEnd(28)} ${n(realV).padStart(10)}   [${p.via}]`);
    }
  }
  if (reKeys.length) {
    console.log(`\n  ── RE-KEY (no cron row yet → overwrite external_id) ──`);
    for (const p of reKeys.slice(0, 60)) {
      const cur = creatorById.get(p.targetId!)!;
      console.log(`    ${p.a.name.padEnd(26)} ${cur.external_id.padEnd(20)} → ${p.a.uid}   [${p.via}/${p.confidence}]${p.note ? " " + p.note : ""}`);
    }
    if (reKeys.length > 60) console.log(`    …and ${reKeys.length - 60} more`);
  }
  if (held.length) {
    console.log(`\n  ⚠ HELD for manual review (${held.length}) — NOT merged, NOT re-keyed, NOT created:`);
    for (const grp of ["multi-uid", "unmatched", "ambiguous", "ghost"] as const) {
      const g = held.filter((p) => p.held === grp);
      if (g.length) {
        console.log(`    ${grp} (${g.length}): ${g.slice(0, 40).map((p) => `${p.a.name} [${n(p.a.views)}v]${p.note ? " (" + p.note + ")" : ""}`).join("  |  ")}${g.length > 40 ? " …" : ""}`);
      }
    }
  }

  // ── PROVE the merge kills the double-count + is permanent ──────────────────────
  // Simulate: collapse each backfill dup's views into its canonical row, then recount humans
  // that still appear as ≥2 all-time rows. Should drop to ~0 (only the held multi-uid cases).
  {
    // creator_id → effective canonical id after MERGE (backfill dup) AND ALIAS-MERGE (secondary uid)
    const remap = new Map<string, string>();
    for (const p of merges) remap.set(p.backfillId!, p.targetId!);
    for (const p of aliasMerges) remap.set(p.aliasRowId!, p.targetId!);
    const viewsByCanon = new Map<string, { name: string; ids: Set<string> }>();
    for (const c of dbCreators) {
      const canon = remap.get(c.id) ?? c.id;
      const e = viewsByCanon.get(`${nameKey(c.name)}`) ?? { name: c.name, ids: new Set<string>() };
      e.ids.add(canon);
      viewsByCanon.set(`${nameKey(c.name)}`, e);
    }
    const stillDup = Array.from(viewsByCanon.values()).filter((e) => e.ids.size > 1);
    const dupBefore = (() => {
      const m = new Map<string, Set<string>>();
      for (const c of dbCreators) { const k = nameKey(c.name); (m.get(k) ?? m.set(k, new Set()).get(k)!).add(c.id); }
      return Array.from(m.values()).filter((s) => s.size > 1).length;
    })();
    console.log(`\n  ── DOUBLE-COUNT: humans with ≥2 all-time rows: BEFORE ${dupBefore} → AFTER merge+alias ${stillDup.length} ──`);
    if (stillDup.length) console.log(`    residual (still HELD, need a confirmed merge): ${stillDup.slice(0, 12).map((e) => e.name).join(", ")}${stillDup.length > 12 ? " …" : ""}`);
    // PERMANENCE: the cron upserts creators on (source, external_id) and consults creator_aliases
    // FIRST. Merged/re-keyed humans end as ONE (sideshift, uid) row; alias-merged secondary uids
    // route to the canonical row → the next sync inserts 0 new rows even if the secondary resurfaces.
    const canonUids = new Set([...merges, ...reKeys, ...already].map((p) => p.a.uid));
    console.log(`  ── PERMANENCE: ${canonUids.size} canonical (sideshift,uid) rows + ${aliasMerges.length} alias(es) post-apply; cron's upsertCreator routes on (source,external_id) and creator_aliases → 0 new creator rows for them. ──`);
  }

  // ── REPORT: per-creator OLD vs API-NEW (the brief's verification table) ────────
  console.log(`\n── ALL-TIME: OLD (DB) vs NEW (API) — top 40 by API total ──`);
  console.log(`  creator                       API-new          DB-old        Δ%   via`);
  for (const p of plans.slice(0, 40)) {
    const apiV = p.a.views;
    const dbV = p.targetId ? (dbViewsByCreator.get(p.targetId) ?? 0) : 0;
    const tag = p.held ? `HELD:${p.held}` : (p.via ?? "");
    console.log(`  ${p.a.name.padEnd(26)} ${n(apiV).padStart(14)} ${n(dbV).padStart(14)}  ${pct(apiV, dbV).padStart(6)}   ${tag}`);
  }
  // spot-check helper
  for (const needle of ["kiera", "casey"]) {
    const hit = authoritative.filter((a) => a.name.toLowerCase().includes(needle));
    console.log(`  spot-check "${needle}": ${hit.map((a) => `${a.name}=${n(a.views)} (${a.programs.length} progs)`).join("; ") || "NOT IN API RESULT (need that brand's key)"}`);
  }

  // ── PROGRAM RECONCILIATION (BRAND grain) ──────────────────────────────────────
  // The CSV backfill is per-BRAND (one program per brand); the API is per-TIER (many programs
  // per brand). Each brand's BACKFILL program is the all-time anchor home. The cron's live
  // tier-programs (the 3 active brands) are separate and are de-duped against the backfill
  // anchor by `programs.brand_key` in allTimeBoard (SQL shown after the report).
  const backfillProgs = dbProgs.filter((p) => p.source === "backfill");
  const matchBackfillProg = (label: string) => {
    const t = normBrand(label);
    return backfillProgs.find((p) => {
      const cands = [normBrand(p.name), normBrand(p.company_name || "")].filter(Boolean);
      return cands.some((c) => c === t || c.includes(t) || t.includes(c));
    });
  };
  const brandLabels = Array.from(new Set(programData.map((d) => d.brandLabel).filter(Boolean) as string[]));
  const bfProgramByBrand = new Map<string, { id: string; name: string }>();
  for (const b of brandLabels) { const bf = matchBackfillProg(b); if (bf) bfProgramByBrand.set(b, { id: bf.id, name: bf.name }); }
  const brandByExt = new Map<string, string>(); // API program ext → brand label
  for (const d of programData) if (d.brandLabel) brandByExt.set(d.program.externalId, d.brandLabel);
  const liveProgExts = new Set(dbProgs.filter((p) => p.source === "sideshift").map((p) => p.external_id));
  console.log(`\n── PROGRAM RECONCILIATION (${brandLabels.length} brands, ${programData.length} API tier-programs) ──`);
  for (const b of brandLabels) {
    const bf = bfProgramByBrand.get(b);
    const tiers = programData.filter((d) => d.brandLabel === b);
    const liveTiers = tiers.filter((d) => liveProgExts.has(d.program.externalId)).length;
    console.log(`    ${b.padEnd(16)} backfill-home ${bf ? `"${bf.name}"`.padEnd(16) : "NONE (live-only)".padEnd(16)} · ${String(tiers.length).padStart(2)} API tiers (${liveTiers} live)`);
  }

  // ── re-anchor + CONFIDENCE GUARD: all-time anchors to the brand API total; the WINDOW is
  //    gated by capture% = brand-backfill-latest / brand-API-total (≥70% additive-shift, else
  //    warming-up). The backfill snapshots live under each human's backfill row UNTIL the merge
  //    re-points them to the canonical row — so capture reads them at `backfillByUid`. ─────────
  const CAPTURE_MIN = 0.7;
  const latestPC = await sql<{ program_id: string; creator_id: string; v: string }[]>`
    select distinct on (program_id, creator_id) program_id, creator_id, lifetime_views v
    from snapshots order by program_id, creator_id, snapshot_date desc`;
  const latestByPC = new Map(latestPC.map((r) => [`${r.program_id}|${r.creator_id}`, Number(r.v)]));
  const progDates = await sql<{ program_id: string; d: string }[]>`select program_id, max(snapshot_date)::text d from snapshots group by program_id`;
  const anchorDateByProg = new Map(progDates.map((r) => [r.program_id, r.d]));
  const today = new Date().toISOString().slice(0, 10);
  const targetByUid = new Map(plans.filter((p) => p.targetId && !p.held).map((p) => [p.a.uid, p.targetId!]));      // canonical identity/anchor home
  // where this human's backfill snapshots live RIGHT NOW: pre-apply = the backfill row (merge/rekey);
  // post-apply (a second --anchor run) = the canonical row they were merged/re-keyed into ("already",
  // whose backfillId is the canonical id). Held/alias-merge carry no own backfill series.
  const backfillByUid = new Map(plans.filter((p) => !p.held && p.action !== "alias-merge" && p.backfillId).map((p) => [p.a.uid, p.backfillId!]));

  type Method = "additive-shift" | "warming-up" | "no-series";
  type Anchor = {
    programId: string; creatorId: string; name: string; program: string;
    apiViews: number; apiPosts: number; current: number | null; anchorDate: string;
    capture: number | null; method: Method;
  };
  // brand-grain aggregation: sum a creator's per-tier API totals up to the brand
  type BrandCreator = { brand: string; uid: string; name: string; views: number; posts: number };
  const byBrandCreator = new Map<string, BrandCreator>();
  for (const d of programData) {
    const brand = d.brandLabel; if (!brand) continue;
    for (const m of d.metrics) {
      const k = `${brand}|${m.externalId}`;
      const e = byBrandCreator.get(k) ?? { brand, uid: m.externalId, name: m.name, views: 0, posts: 0 };
      e.views += m.lifetimeViews; e.posts += m.lifetimePosts;
      byBrandCreator.set(k, e);
    }
  }
  const anchorPlan: Anchor[] = [];
  const irreconcilable: string[] = [];
  let liveOnly = 0; // (brand,creator) on a brand with no backfill → all-time comes from live tiers
  for (const e of Array.from(byBrandCreator.values())) {
    const cid = targetByUid.get(e.uid);
    if (!cid) continue; // held creators (incl. ghost-uid) never anchor
    const bfProg = bfProgramByBrand.get(e.brand);
    if (!bfProg) { liveOnly++; continue; }
    const bfid = backfillByUid.get(e.uid) ?? null; // this human's backfill snapshots (post-merge → canonical)
    const cur = bfid ? (latestByPC.get(`${bfProg.id}|${bfid}`) ?? null) : null;
    const apiTotal = e.views;
    if (cur === 0 && apiTotal > 0) { irreconcilable.push(`${e.name} / ${e.brand} (latest=0, API=${n(apiTotal)})`); continue; }
    const capture = cur === null || apiTotal === 0 ? null : cur / apiTotal;
    const method: Method = cur === null ? "no-series" : (capture !== null && capture >= CAPTURE_MIN ? "additive-shift" : "warming-up");
    anchorPlan.push({ programId: bfProg.id, creatorId: cid, name: e.name, program: e.brand, apiViews: apiTotal, apiPosts: e.posts, current: cur, anchorDate: anchorDateByProg.get(bfProg.id) ?? today, capture, method });
  }
  const byMethod = (mm: Method) => anchorPlan.filter((a) => a.method === mm);
  console.log(`\n── RE-ANCHOR + CONFIDENCE GUARD (${anchorPlan.length} BRAND-creator series, capture ≥ ${CAPTURE_MIN * 100}% keeps its window) ──`);
  console.log(`  additive-shift: ${byMethod("additive-shift").length} · warming-up: ${byMethod("warming-up").length} · anchor-only(no backfill series): ${byMethod("no-series").length} · live-only(no backfill brand, all-time from live): ${liveOnly}`);
  console.log(`  creator                       brand                  capture   method      brand-total→`);
  for (const a of anchorPlan.slice(0, 40)) {
    const capStr = a.capture === null ? "  n/a" : `${(a.capture * 100).toFixed(0)}%`;
    console.log(`  ${a.name.slice(0, 26).padEnd(26)} ${a.program.slice(0, 20).padEnd(20)} ${capStr.padStart(6)}   ${a.method.padEnd(14)} ${n(a.apiViews)}`);
  }
  if (anchorPlan.length > 40) console.log(`    …and ${anchorPlan.length - 40} more`);

  // INVARIANT: brand-grain anchoring must NOT change all-time per creator. Σ a creator's
  // brand anchors == Σ their per-uid API totals over bf-homed programs (== 28.6M for Kiera).
  const anchoredByCreator = new Map<string, number>();
  for (const a of anchorPlan) anchoredByCreator.set(a.creatorId, (anchoredByCreator.get(a.creatorId) ?? 0) + a.apiViews);
  for (const needle of ["kiera", "casey"]) {
    const p = plans.find((pl) => !pl.held && pl.a.name.toLowerCase().includes(needle));
    if (p?.targetId) {
      const anchoredSum = anchoredByCreator.get(p.targetId) ?? 0;
      const bfHomed = p.a.programs.filter((pr) => bfProgramByBrand.has(brandByExt.get(pr.ext) ?? "")).reduce((s, pr) => s + pr.views, 0);
      console.log(`  invariant "${needle}": Σ brand-anchors ${n(anchoredSum)} == Σ per-tier (bf-homed) ${n(bfHomed)}  ${anchoredSum === bfHomed ? "✓" : "✗ MISMATCH"}  (full all-time ${n(p.a.views)})`);
    }
  }
  const warming = byMethod("warming-up");
  if (warming.length) console.log(`  ⚠ WINDOW → WARMING-UP (low capture, all-time still anchored): ${warming.slice(0, 25).map((a) => `${a.name} (${a.capture !== null ? (a.capture * 100).toFixed(0) + "%" : "n/a"})`).join(", ")}${warming.length > 25 ? " …" : ""}`);
  if (irreconcilable.length) console.log(`  ⚠ IRRECONCILABLE (latest=0, can't reconcile — manual review): ${irreconcilable.slice(0, 20).join("; ")}${irreconcilable.length > 20 ? " …" : ""}`);

  const ANCHOR = argv.includes("--anchor");
  if (!APPLY) {
    console.log(`\nDRY-RUN only. Sequence (when approved; migrate 0004 brand_key + 0005 creator_aliases first):`);
    console.log(`  --apply           MERGE backfill dups + ALIAS-MERGE confirmed multi-uid + RE-KEY + set brand_key`);
    console.log(`  --apply --anchor  ALSO anchor brand all-time + additive-shift well-captured + warming-up windows`);
    console.log(`                    (--anchor requires migration 0004 programs.brand_key + the allTimeBoard dedup)\n`);
    await sql.end();
    return;
  }

  // ── APPLY (sequence: MERGE → RE-KEY → set brand_key → --anchor) ────────────────
  // Abort only if there is genuinely nothing to do. A second `--anchor` run (after identity was
  // already unified) has 0 merges/re-keys but still has anchors to write — must not bail then.
  if (!merges.length && !reKeys.length && !aliasMerges.length && !(ANCHOR && anchorPlan.length)) {
    console.log("\n✖ Nothing to apply (no merges/aliases/re-keys, and no anchors). Aborting.\n"); await sql.end(); return;
  }
  // brand_key + the allTimeBoard dedup must exist before --anchor, else cron-brand anchors
  // double-count against live tiers. Refuse --anchor if the column is missing (migration 0004).
  const hasBrandKey = (await sql`select 1 from information_schema.columns where table_name='programs' and column_name='brand_key'`).length > 0;
  if (ANCHOR && !hasBrandKey) { console.log("\n✖ --anchor needs programs.brand_key (migration 0004) + the allTimeBoard dedup. Apply that first.\n"); await sql.end(); return; }

  let merged = 0, aliasMerged = 0, reKeyedCreators = 0, anchorsWritten = 0, reshapedRows = 0, lowConfMarked = 0, brandKeysSet = 0;
  await sql.begin(async (tx) => {
    // re-point a creator's children → canonical (conflict-safe), drop leftovers, delete the row.
    const foldInto = async (fromId: string, canon: string) => {
      await tx`update snapshots s set creator_id = ${canon} where s.creator_id = ${fromId}
        and not exists (select 1 from snapshots x where x.snapshot_date=s.snapshot_date and x.program_id=s.program_id and x.creator_id=${canon})`;
      await tx`update campaign_accounts a set creator_id = ${canon} where a.creator_id = ${fromId}
        and not exists (select 1 from campaign_accounts x where x.program_id=a.program_id and x.creator_id=${canon} and x.platform=a.platform and x.handle=a.handle)`;
      await tx`update program_creators pc set creator_id = ${canon} where pc.creator_id = ${fromId}
        and not exists (select 1 from program_creators x where x.program_id=pc.program_id and x.creator_id=${canon})`;
      await tx`delete from snapshots where creator_id = ${fromId}`;
      await tx`delete from campaign_accounts where creator_id = ${fromId}`;
      await tx`delete from program_creators where creator_id = ${fromId}`;
      const d = await tx`delete from creators where id = ${fromId}`;
      return d.count ?? 0;
    };
    // 1a. MERGE backfill dup → canonical. Idempotent — once gone there is nothing left to merge.
    for (const p of merges) merged += await foldInto(p.backfillId!, p.targetId!);
    // 1b. ALIAS-MERGE: fold the SECONDARY real-uid row into canonical, then record the alias so the
    //     cron routes that uid forever (it can still appear in topCreators). Real-uid ≠ synthetic.
    for (const p of aliasMerges) {
      aliasMerged += await foldInto(p.aliasRowId!, p.targetId!);
      await tx`insert into creator_aliases (source, alias_external_id, canonical_creator_id, note)
        values ('sideshift', ${p.a.uid}, ${p.targetId}, ${`confirmed multi-uid: ${p.a.name}`})
        on conflict (source, alias_external_id) do update set canonical_creator_id = ${p.targetId}`;
    }
    // 2. RE-KEY backfill rows with no cron twin → overwrite external_id (one real-uid row per human)
    for (const p of reKeys) {
      const res = await tx`update creators set external_id = ${p.a.uid}, source = 'sideshift', updated_at = now()
        where id = ${p.targetId} and external_id <> ${p.a.uid}`;
      reKeyedCreators += res.count ?? 0;
    }
    // 3. brand_key on every backfill program + its live tier-programs (so allTimeBoard can dedup
    //    a brand's backfill/anchor row against the live tiers — one source per (brand_key, creator)).
    for (const [brand, bf] of Array.from(bfProgramByBrand.entries())) {
      const r1 = await tx`update programs set brand_key = ${brand} where id = ${bf.id}`;
      brandKeysSet += r1.count ?? 0;
      const exts = programData.filter((d) => d.brandLabel === brand && liveProgExts.has(d.program.externalId)).map((d) => d.program.externalId);
      if (exts.length) { const r2 = await tx`update programs set brand_key = ${brand} where source='sideshift' and external_id = any(${exts})`; brandKeysSet += r2.count ?? 0; }
    }
    // 4. ANCHOR + reshape (ONLY with --anchor). All-time anchors to the brand API total; window
    //    gated by capture: additive-shift (≥70%) preserves real deltas; warming-up (<70%) writes
    //    an 'anchor' row + window_confident=false → deltaBoard sources that pair from live rows only.
    if (ANCHOR) {
      for (const an of anchorPlan) {
        if (an.method === "additive-shift" && an.current !== null && an.current !== an.apiViews) {
          const delta = an.apiViews - an.current;
          const r = await tx`update snapshots set lifetime_views = lifetime_views + ${delta}
            where program_id = ${an.programId} and creator_id = ${an.creatorId}
              and source is distinct from 'live' and source is distinct from 'anchor'`;
          reshapedRows += r.count ?? 0;
          continue;
        }
        await tx`insert into snapshots (snapshot_date, program_id, creator_id, lifetime_views, lifetime_posts, source, captured_at)
          values (${an.anchorDate}, ${an.programId}, ${an.creatorId}, ${an.apiViews}, ${an.apiPosts}, 'anchor', now())
          on conflict (snapshot_date, program_id, creator_id)
          do update set lifetime_views = ${an.apiViews}, lifetime_posts = ${an.apiPosts}, source = 'anchor', captured_at = now()`;
        anchorsWritten++;
        if (an.method === "warming-up") {
          await tx`insert into program_creators (program_id, creator_id, status, window_confident)
            values (${an.programId}, ${an.creatorId}, 'active', false)
            on conflict (program_id, creator_id) do update set window_confident = false`;
          lowConfMarked++;
        }
      }
    }
    await tx`insert into sync_runs (source, finished_at, status, programs_synced, rows_written, warnings)
      values ('repull-alltime', now(), 'ok', ${bfProgramByBrand.size}, ${anchorsWritten},
        ${sql.json({ merged, aliasMerged, reKeyedCreators, brandKeysSet, anchorsWritten, reshapedRows, lowConfMarked, anchored: ANCHOR, irreconcilable,
          mergePairs: merges.map((p) => ({ name: p.a.name, from: creatorById.get(p.backfillId!)?.external_id, to: p.a.uid })),
          aliasPairs: aliasMerges.map((p) => ({ name: p.a.name, alias: p.a.uid, canonical: creatorById.get(p.targetId!)?.external_id })) })})`;
  });
  console.log(`\ndone: merged ${merged}, alias-merged ${aliasMerged}, re-keyed ${reKeyedCreators}, brand_keys ${brandKeysSet}, anchors ${anchorsWritten}, additive-shifted ${reshapedRows}, warming-up ${lowConfMarked}${ANCHOR ? "" : " (run with --anchor to write anchors)"}.`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
