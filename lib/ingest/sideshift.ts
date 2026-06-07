// Sideshift adapter — the ONLY module that talks to the Sideshift API.
// Confirmed contract: docs/DECISIONS.md (topic: sideshift-api).
//
//   Base: https://app.sideshift.app/api/v1   Auth: header `x-api-key: <key>`
//   GET /programs?status=active                  → paginated programs
//   GET /creators?programId=X&limit=200          → paginated full roster + handles
//   GET /analytics/overview?programId=X&topCreatorsLimit=1000
//                                                → data.topCreators[] = lifetime totals
//
// Everything is normalized into lib/ingest/types.ts shapes; nothing outside this
// file imports Sideshift or knows its wire format.

import type {
  IngestAdapter, NormalizedProgram, NormalizedProgramData,
  NormalizedRosterEntry, NormalizedCreatorMetric, RawPayload,
} from "./types";

const PAGE_SIZE = 200;       // /creators default page is 25; ask for the max
const TOP_CREATORS_LIMIT = 1000; // > any single program's active-creator count

function config() {
  const apiKey = process.env.SIDESHIFT_API_KEY;
  const baseUrl = (process.env.SIDESHIFT_BASE_URL || "https://app.sideshift.app/api/v1").replace(/\/+$/, "");
  if (!apiKey) throw new Error("SIDESHIFT_API_KEY is not set.");
  return { apiKey, baseUrl };
}

/** unix seconds → Date (Sideshift timestamps are seconds, not ms). */
function fromUnix(secs: unknown): Date | null {
  return typeof secs === "number" && secs > 0 ? new Date(secs * 1000) : null;
}

type Json = Record<string, any>;

async function apiGet(path: string): Promise<Json> {
  const { apiKey, baseUrl } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
    // Always hit the live API; this runs server-side in the cron, never cached.
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Sideshift ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Sideshift ${path} → non-JSON response: ${text.slice(0, 120)}`);
  }
}

/** Walk every page of a `{data, page, totalPages}` endpoint. */
async function getAllPages(buildPath: (page: number) => string): Promise<{ items: Json[]; pages: Json[] }> {
  const items: Json[] = [];
  const pages: Json[] = [];
  let page = 1;
  // Hard cap so a misbehaving API can never loop forever.
  for (; page <= 100; page++) {
    const body = await apiGet(buildPath(page));
    pages.push(body);
    const data = Array.isArray(body.data) ? body.data : [];
    items.push(...data);
    const totalPages = Number(body.totalPages) || 1;
    if (page >= totalPages || data.length === 0) break;
  }
  return { items, pages };
}

function mapProgram(p: Json): NormalizedProgram {
  return {
    externalId: String(p.id),
    name: String(p.name ?? "Untitled program"),
    companyId: p.companyId ?? null,
    companyName: p.companyName ?? null,
    status: p.status === "active" ? "active" : "ended",
    startsAt: fromUnix(p.startsAt),
    endsAt: fromUnix(p.endsAt),
  };
}

export const sideshiftAdapter: IngestAdapter = {
  source: "sideshift",

  async listActivePrograms() {
    const { items, pages } = await getAllPages(
      (page) => `/programs?status=active&page=${page}&limit=${PAGE_SIZE}`
    );
    const raw: RawPayload[] = pages.map((payload) => ({ endpoint: "/programs", payload }));
    return { programs: items.map(mapProgram), raw };
  },

  async fetchProgramData(program: NormalizedProgram): Promise<NormalizedProgramData> {
    const pid = program.externalId;
    const raw: RawPayload[] = [];

    // 1. Full roster (CRM identity + per-program handles) — paginated.
    const { items: creatorItems, pages: creatorPages } = await getAllPages(
      (page) => `/creators?programId=${encodeURIComponent(pid)}&page=${page}&limit=${PAGE_SIZE}`
    );
    for (const payload of creatorPages) raw.push({ endpoint: "/creators", programExternalId: pid, payload });

    const roster: NormalizedRosterEntry[] = creatorItems.map((c) => {
      // campaigns[] spans all of a creator's programs; pull THIS program's handles.
      const campaigns = Array.isArray(c.campaigns) ? c.campaigns : [];
      const here = campaigns.find((cm: Json) => String(cm.programId) === String(pid));
      const handles = Array.isArray(here?.handles) ? here.handles : [];
      const accounts = handles
        .filter((h: Json) => h?.platform && h?.handle)
        .map((h: Json) => ({
          platform: String(h.platform).toLowerCase(),
          handle: String(h.handle),
          profileImageUrl: c.profileImageUrl ?? null,
        }));
      return {
        externalId: String(c.id),
        name: String(c.name ?? "Unknown"),
        email: c.email ?? null,
        profileImageUrl: c.profileImageUrl ?? null,
        participationStatus: here?.contractStatus ? String(here.contractStatus) : "active",
        accounts,
      };
    });

    // 2. Per-creator lifetime metrics (snapshot facts) — single call, big limit.
    const overview = await apiGet(
      `/analytics/overview?programId=${encodeURIComponent(pid)}&topCreatorsLimit=${TOP_CREATORS_LIMIT}`
    );
    raw.push({ endpoint: "/analytics/overview", programExternalId: pid, payload: overview });

    const topCreators: Json[] = Array.isArray(overview?.data?.topCreators) ? overview.data.topCreators : [];
    const uniqueCreators = Number(overview?.data?.summary?.uniqueCreators);
    if (Number.isFinite(uniqueCreators) && topCreators.length < uniqueCreators) {
      // The limit didn't return everyone with activity — surfaces as a warning upstream.
      throw new Error(
        `topCreators returned ${topCreators.length} but summary.uniqueCreators=${uniqueCreators} for program ${pid}`
      );
    }
    const metrics: NormalizedCreatorMetric[] = topCreators.map((t) => ({
      externalId: String(t.id),
      name: String(t.name ?? "Unknown"),
      lifetimeViews: Number(t.totalViews) || 0,
      lifetimePosts: Number(t.totalPosts) || 0,
    }));

    return { program, roster, metrics, raw };
  },
};
