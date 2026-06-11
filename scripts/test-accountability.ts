// Committed, re-runnable proof of the campaign accountability math.
//
// Calls the REAL exported buildAccountabilityReport from lib/queries/accountability.ts
// (not a copy of the SQL), so any future edit that breaks the posts-delta, the gap
// normalization, the behind/on-track/no-data classification, or the active-only scope
// fails here. Data trust is the product.
//
//   node --env-file=.env.local --import tsx --test scripts/test-accountability.ts
//
// Seeds ISOLATED synthetic rows (source = "test_acc") and asserts only against its own
// program by id, so it is safe to run against a populated dev DB (real active programs
// like Allinmotion may also appear in the report; we ignore them).

import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { buildAccountabilityReport, DAILY_POST_TARGET } from "@/lib/queries/accountability";
import { closeDb } from "@/lib/db/client";

const SRC = "test_acc";
const sql = postgres(process.env.POSTGRES_URL!, { prepare: false });

async function wipe() {
  await sql`delete from snapshots where program_id in (select id from programs where source = ${SRC})`;
  await sql`delete from creators where source = ${SRC}`;
  await sql`delete from programs where source = ${SRC}`;
}
async function newProgram(ext: string, status: "active" | "ended", company?: string): Promise<string> {
  const [r] = await sql`insert into programs (source, external_id, name, status, company_name)
    values (${SRC}, ${ext}, ${"TEST " + ext}, ${status}, ${company ?? null}) returning id`;
  return r.id;
}
async function newCreator(ext: string, name: string): Promise<string> {
  const [r] = await sql`insert into creators (source, external_id, name)
    values (${SRC}, ${ext}, ${name}) returning id`;
  return r.id;
}
function snap(pid: string, cid: string, date: string, posts: number, views = 0) {
  return sql`insert into snapshots (snapshot_date, program_id, creator_id, lifetime_posts, lifetime_views)
    values (${date}, ${pid}, ${cid}, ${posts}, ${views})`;
}

beforeEach(wipe);
after(async () => {
  await wipe();
  await sql.end();
  await closeDb();
});

test("classifies behind / on-track and normalizes the gap", async () => {
  const pid = await newProgram("acc1", "active", "Acme");
  // 2-day gap (06-01 -> 06-03): expected = target * 2 = 8.
  const behind = await newCreator("c-behind", "Behind Betty");
  await snap(pid, behind, "2026-06-01", 10);
  await snap(pid, behind, "2026-06-03", 12); // +2 over 2 days, target 8 -> behind
  const onTrack = await newCreator("c-ontrack", "Ontrack Olek");
  await snap(pid, onTrack, "2026-06-01", 0);
  await snap(pid, onTrack, "2026-06-03", 9); // +9 over 2 days, target 8 -> on track

  const report = await buildAccountabilityReport({ asOf: "2026-06-03" });
  const camp = report.companies.find((c) => c.company === "Acme");
  assert.ok(camp, "synthetic company present");
  assert.equal(camp!.target, DAILY_POST_TARGET);

  const b = camp!.creators.find((c) => c.name === "Behind Betty")!;
  assert.equal(b.status, "behind");
  assert.equal(b.postsDelta, 2);
  assert.equal(b.gapDays, 2);
  assert.equal(b.expected, DAILY_POST_TARGET * 2);
  assert.equal(b.since, "2026-06-01");

  const o = camp!.creators.find((c) => c.name === "Ontrack Olek")!;
  assert.equal(o.status, "on_track");
  assert.equal(o.postsDelta, 9);

  assert.deepEqual(camp!.behind.map((c) => c.name), ["Behind Betty"]);
  assert.deepEqual(camp!.onTrack.map((c) => c.name), ["Ontrack Olek"]);
});

test("a single snapshot is no_data, never a fake zero", async () => {
  const pid = await newProgram("acc2", "active", "Beta");
  const c = await newCreator("c-new", "New Nadia");
  await snap(pid, c, "2026-06-03", 5); // only one snapshot

  const report = await buildAccountabilityReport({ asOf: "2026-06-03" });
  const camp = report.companies.find((p) => p.company === "Beta")!;
  const e = camp.creators.find((x) => x.name === "New Nadia")!;
  assert.equal(e.status, "no_data");
  assert.equal(e.postsDelta, null);
  assert.equal(e.expected, null);
  assert.equal(camp.noData.length, 1);
});

test("ended campaigns are excluded (frozen data cannot masquerade as today)", async () => {
  const pid = await newProgram("acc-ended", "ended", "Gamma");
  const c = await newCreator("c-ended", "Ended Ed");
  await snap(pid, c, "2026-06-01", 0);
  await snap(pid, c, "2026-06-03", 1);

  const report = await buildAccountabilityReport({ asOf: "2026-06-03" });
  assert.equal(report.companies.find((p) => p.company === "Gamma"), undefined);
});

test("asOf measures at/<= the reference date, not the future", async () => {
  const pid = await newProgram("acc3", "active", "Delta");
  const c = await newCreator("c-asof", "AsOf Aria");
  await snap(pid, c, "2026-06-01", 0);
  await snap(pid, c, "2026-06-02", 4); // within window
  await snap(pid, c, "2026-06-05", 99); // AFTER asOf -> ignored

  const report = await buildAccountabilityReport({ asOf: "2026-06-02" });
  const camp = report.companies.find((p) => p.company === "Delta")!;
  const e = camp.creators.find((x) => x.name === "AsOf Aria")!;
  assert.equal(e.asOf, "2026-06-02");
  assert.equal(e.postsDelta, 4); // 4 - 0, not 99
});

test("groups tiers by company and de-dupes a creator across tiers (counted once, posts summed)", async () => {
  // Same company "DupCo", two tiers (programs). One creator is in BOTH tiers (same
  // stable creator_id); a second creator is in only one tier.
  const tierA = await newProgram("dup-a", "active", "DupCo");
  const tierB = await newProgram("dup-b", "active", "DupCo");
  const shared = await newCreator("c-shared", "Shared Sam"); // appears in BOTH tiers
  const solo = await newCreator("c-solo", "Solo Sue"); // tierA only

  // Shared Sam over a 1-day gap: +3 posts in tierA, +2 in tierB → company total +5.
  await snap(tierA, shared, "2026-06-01", 10);
  await snap(tierA, shared, "2026-06-02", 13); // +3
  await snap(tierB, shared, "2026-06-01", 100);
  await snap(tierB, shared, "2026-06-02", 102); // +2
  await snap(tierA, solo, "2026-06-01", 0);
  await snap(tierA, solo, "2026-06-02", 1); // +1

  const report = await buildAccountabilityReport({ asOf: "2026-06-02" });
  const dupco = report.companies.find((c) => c.company === "DupCo")!;
  assert.ok(dupco, "DupCo company section present");

  // Both tiers folded into ONE section.
  assert.deepEqual(dupco.programNames, ["TEST dup-a", "TEST dup-b"]);

  // Shared Sam appears EXACTLY ONCE despite being in two tiers.
  const sams = dupco.creators.filter((c) => c.creatorId === shared);
  assert.equal(sams.length, 1, "creator in two tiers is counted once");
  // Posts summed across tiers: 3 + 2 = 5 (target 4/day, 1-day gap → on track).
  assert.equal(sams[0].postsDelta, 5);
  assert.equal(sams[0].gapDays, 1);
  assert.equal(sams[0].expected, DAILY_POST_TARGET);
  assert.equal(sams[0].status, "on_track");

  // Solo Sue: +1 < 4 → behind. Two distinct creators total in the company.
  assert.equal(dupco.creators.length, 2);
  const sue = dupco.creators.find((c) => c.creatorId === solo)!;
  assert.equal(sue.postsDelta, 1);
  assert.equal(sue.status, "behind");
});
