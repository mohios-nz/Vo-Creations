// Committed, re-runnable proof of the leaderboard window math.
//
// This calls the REAL exported functions from lib/queries/leaderboard.ts (not a copy
// of the SQL), so any future edit that breaks 7d/30d deltas, all-time, ranking, or
// warm-up fails here. Data trust is the product — the math must stay proven.
//
// Run locally:  npm run test:leaderboard   (against your dev DB; see the foreign-data
//   note below). In CI it runs against a throwaway Postgres with only this data.
//
//   node --env-file=.env.local --import tsx --test scripts/test-leaderboard.ts
//
// The suite seeds ISOLATED synthetic programs/creators/snapshots (source = "test_lb"),
// asserts, and tears them down. Overall-board tests need a DB containing ONLY this
// synthetic data (getOverallLeaderboard spans every program); if real data is present
// (a populated dev DB) they SKIP with a note. CI's empty Postgres runs them for real.

import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { getCampaignLeaderboard, getOverallLeaderboard } from "@/lib/queries/leaderboard";
import { closeDb } from "@/lib/db/client";

const SRC = "test_lb";
const sql = postgres(process.env.POSTGRES_URL!, { prepare: false });

/** Wipe only our synthetic rows (safe against a populated dev DB). */
async function wipe() {
  await sql`delete from snapshots where program_id in (select id from programs where source = ${SRC})`;
  await sql`delete from campaign_accounts where creator_id in (select id from creators where source = ${SRC})`;
  await sql`delete from program_creators where creator_id in (select id from creators where source = ${SRC})`;
  await sql`delete from creators where source = ${SRC}`;
  await sql`delete from programs where source = ${SRC}`;
}

async function newProgram(ext: string): Promise<string> {
  const [r] = await sql`insert into programs (source, external_id, name, status)
    values (${SRC}, ${ext}, ${"TEST " + ext}, 'active') returning id`;
  return r.id;
}
async function newCreator(ext: string, name: string): Promise<string> {
  const [r] = await sql`insert into creators (source, external_id, name)
    values (${SRC}, ${ext}, ${name}) returning id`;
  return r.id;
}
function snap(pid: string, cid: string, date: string, views: number, posts = 0) {
  return sql`insert into snapshots (snapshot_date, program_id, creator_id, lifetime_views, lifetime_posts)
    values (${date}, ${pid}, ${cid}, ${views}, ${posts})`;
}
/** Is there non-synthetic snapshot data present? (overall tests require none.) */
async function hasForeignData(): Promise<boolean> {
  const [r] = await sql`select count(*)::int c from snapshots s
    join programs p on p.id = s.program_id where p.source <> ${SRC}`;
  return r.c > 0;
}
const line = (b: { entries: { name: string; views: number; rank: number }[] }) =>
  b.entries.map((e) => `${e.name}:${e.views}:#${e.rank}`);

// Per-test clean slate: overall-board tests span EVERY program, so leftover synthetic
// data from an earlier test would pollute them. wipe before each, and once at the end.
beforeEach(wipe);
after(async () => {
  await wipe();
  await sql.end();      // close the test's own seeding connection
  await closeDb();      // AND the leaderboard module's connection, else the process never exits
});

test("campaign 7d/30d/all-time: deltas, tie ranks, latest-not-max, mid-window fallback", async () => {
  const p = await newProgram("p1");
  const a = await newCreator("c-a", "Alpha");
  const b = await newCreator("c-b", "Bravo");
  const c = await newCreator("c-c", "Charlie");
  const d = await newCreator("c-d", "Delta");
  // span 2099-01-01 .. 01-31 (30d). cutoff7 = 01-24, cutoff30 = 01-01.
  await snap(p, a, "2099-01-01", 1000); await snap(p, a, "2099-01-24", 5000); await snap(p, a, "2099-01-31", 9000);
  await snap(p, b, "2099-01-01", 2000); await snap(p, b, "2099-01-24", 2500); await snap(p, b, "2099-01-31", 10000);
  await snap(p, c, "2099-01-28", 2000); await snap(p, c, "2099-01-31", 3000); // joined after both cutoffs
  await snap(p, d, "2099-01-24", 8000); await snap(p, d, "2099-01-31", 6000); // EROSION: latest < earlier

  const d7 = await getCampaignLeaderboard(p, "7d");
  assert.equal(d7.warmingUp, false);
  assert.equal(d7.daysOfHistory, 30);
  assert.deepEqual(line(d7), ["Bravo:7500:#1", "Alpha:4000:#2", "Charlie:1000:#3", "Delta:0:#4"]);

  const d30 = await getCampaignLeaderboard(p, "30d");
  // Alpha 8000, Bravo 8000 (TIE → both #1, views-only), Charlie 1000 (#3), Delta 0 (#4)
  assert.deepEqual(line(d30), ["Alpha:8000:#1", "Bravo:8000:#1", "Charlie:1000:#3", "Delta:0:#4"]);

  const at = await getCampaignLeaderboard(p, "all-time");
  // all-time = LATEST lifetime: Delta is 6000 (latest), NOT 8000 (its earlier peak)
  assert.deepEqual(line(at), ["Bravo:10000:#1", "Alpha:9000:#2", "Delta:6000:#3", "Charlie:3000:#4"]);
});

test("campaign warm-up: a program with < 7 days history returns warmingUp, no entries", async () => {
  const p = await newProgram("young");
  const a = await newCreator("y-a", "Young");
  await snap(p, a, "2099-02-01", 500);
  await snap(p, a, "2099-02-03", 900); // 2-day span < 7
  const b7 = await getCampaignLeaderboard(p, "7d");
  assert.equal(b7.warmingUp, true);
  assert.equal(b7.entries.length, 0);
  assert.equal(b7.daysOfHistory, 2); // honest: "best is 2 days, need 7"
  // all-time still works from day one
  const at = await getCampaignLeaderboard(p, "all-time");
  assert.equal(at.warmingUp, false);
  assert.equal(at.entries.length, 1);
});

test("overall warm-up: disjoint YOUNG programs must NOT report a stitched non-warming empty board", async (t) => {
  if (await hasForeignData()) {
    t.skip("overall-board tests require a DB with only synthetic data (run in CI)");
    return;
  }
  // Two programs, each 0-day span, 19 calendar days apart. The old global-span bug
  // would see span=19 (>=7) → warmingUp:false with entries:[]. Per-program → warm-up.
  const p1 = await newProgram("y1");
  const p2 = await newProgram("y2");
  const a = await newCreator("o-a", "One");
  await snap(p1, a, "2099-03-01", 1000);
  await snap(p2, a, "2099-03-20", 2000);
  const b7 = await getOverallLeaderboard("7d");
  assert.equal(b7.warmingUp, true, "disjoint young programs must warm up, not show empty");
  assert.equal(b7.entries.length, 0);
});

test("overall all-time: a creator's latest lifetime is summed across their programs", async (t) => {
  if (await hasForeignData()) {
    t.skip("overall-board tests require a DB with only synthetic data (run in CI)");
    return;
  }
  const p1 = await newProgram("s1");
  const p2 = await newProgram("s2");
  const a = await newCreator("s-a", "Solo"); // same human on both programs
  await snap(p1, a, "2099-04-01", 4000);
  await snap(p2, a, "2099-04-01", 6000);
  const at = await getOverallLeaderboard("all-time");
  assert.deepEqual(line(at), ["Solo:10000:#1"]); // 4000 + 6000
});
