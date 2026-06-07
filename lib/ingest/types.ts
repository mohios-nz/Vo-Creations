// The swappable ingest seam.
//
// Every data source (Sideshift today; Phyllo/Shortimize/etc. later) implements
// IngestAdapter. The pipeline (lib/ingest/sync.ts) only ever talks to this
// interface — it never imports a vendor SDK. Add a source = add an adapter that
// returns these normalized shapes; nothing downstream changes. That is the
// "prove the seam" promise of Phase 6.
//
// These types are derived from the canonical schema (lib/db/schema.ts), NOT from
// any vendor's wire format. A vendor's raw payload is normalized INTO these.
//
// Phase 0 revealed Sideshift splits its data two ways, and the seam mirrors that
// because it's the natural shape of any creator-campaign source:
//   • roster  — every creator ON the campaign (CRM identity + handles), even
//               those with no activity. Drives creators / program_creators /
//               campaign_accounts.
//   • metrics — only creators WITH activity, carrying lifetime view/post totals.
//               Drives snapshots. Kept separate so we never synthesise a phantom
//               zero for a roster-only creator (which would read as a view drop).

/** Verbatim source response, landed immutably in raw_ingest. */
export interface RawPayload {
  endpoint: string;
  programExternalId?: string | null;
  payload: unknown;
}

/** A campaign as the source sees it. Upserts into `programs`. */
export interface NormalizedProgram {
  externalId: string;            // the source's program id
  name: string;
  companyId?: string | null;
  companyName?: string | null;   // the brand
  status?: "active" | "ended";
  startsAt?: Date | null;
  endsAt?: Date | null;
}

/** One social handle a creator used on a campaign. Upserts into `campaign_accounts`. */
export interface NormalizedAccount {
  platform: string;              // tiktok | instagram | youtube | ...
  handle: string;
  profileImageUrl?: string | null;
}

/**
 * A creator's CRM identity + their handles on ONE campaign. externalId is the
 * STABLE source userId that auto-links all of a creator's accounts to one human
 * (creators.external_id). Covers EVERY creator on the campaign.
 */
export interface NormalizedRosterEntry {
  externalId: string;            // stable source userId — the auto-link key
  name: string;
  email?: string | null;
  profileImageUrl?: string | null;
  participationStatus?: string;  // e.g. active | cancelled | pending (→ program_creators.status)
  accounts: NormalizedAccount[]; // the handles this creator used on THIS campaign
}

/**
 * One creator's aggregated lifetime standing on ONE campaign — the snapshot
 * grain. Only creators with activity appear. Immune to cycle rollover (lifetime).
 */
export interface NormalizedCreatorMetric {
  externalId: string;            // stable source userId (joins to a roster entry)
  name: string;                  // denormalised for a minimal-upsert fallback
  lifetimeViews: number;
  lifetimePosts: number;
}

/** Everything one source knows about one campaign, plus the raw payloads to land. */
export interface NormalizedProgramData {
  program: NormalizedProgram;
  roster: NormalizedRosterEntry[];      // → CRM tables (all creators)
  metrics: NormalizedCreatorMetric[];   // → snapshots (active creators only)
  raw: RawPayload[];
}

export interface IngestAdapter {
  /** Stable source key, e.g. "sideshift". Written to every row's `source`. */
  readonly source: string;

  /** List the active campaigns to sync this run, plus the raw list payload. */
  listActivePrograms(): Promise<{ programs: NormalizedProgram[]; raw: RawPayload[] }>;

  /**
   * Fetch + normalize ONE campaign's roster + metrics. Throws on transport/parse
   * failure — the pipeline isolates per-program so one bad campaign does not fail
   * the batch.
   */
  fetchProgramData(program: NormalizedProgram): Promise<NormalizedProgramData>;
}
