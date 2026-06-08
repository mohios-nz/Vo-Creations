import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCreatorByEmail, getCreatorPrograms, getCreatorHandles, isStaffEmail,
} from "@/lib/queries/creator-access";
import {
  getOverallLeaderboard, getCampaignLeaderboard, getLeaderboardPrograms,
  type Leaderboard, type LeaderboardWindow, type LeaderboardEntry,
} from "@/lib/queries/leaderboard";
import { avatarGradient, initials, PLATFORM_ICON } from "./avatar";
import { CampaignSelect, WindowSegment } from "./BoardControls";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const WINDOW_MAP: Record<string, LeaderboardWindow> = { "7": "7d", "30": "30d", all: "all-time" };
const WINDOW_NEED: Record<string, number> = { "7": 7, "30": 30, all: 0 };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { c?: string; w?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/leaderboard/login");

  // STAFF (Google-authed, allow-listed) get the full dashboard: ALL campaigns,
  // unscoped switcher, not ranked. Everyone else resolves to a creator; unknown
  // non-staff emails get the directed screen.
  const staff = isStaffEmail(user.email);
  let programs: { id: string; externalId: string; name: string }[];
  let youId = ""; // "" → no row ever matches → no YOU highlight (staff aren't ranked)
  if (staff) {
    programs = (await getLeaderboardPrograms()).map((p) => ({ id: p.id, externalId: p.externalId, name: p.name }));
  } else {
    const creator = await getCreatorByEmail(user.email);
    if (!creator) return <UnknownEmail email={user.email} />;
    programs = (await getCreatorPrograms(creator.id)).map((p) => ({ id: p.id, externalId: p.externalId, name: p.name }));
    youId = creator.id;
  }

  // Resolve scope from the URL. `selected` only resolves against the in-scope program
  // list (a creator's own; ALL of them for staff), so a non-staff creator can never
  // reach another campaign's board by tampering `c`.
  const wKey = searchParams.w && WINDOW_MAP[searchParams.w] ? searchParams.w : "7";
  const window = WINDOW_MAP[wKey];
  const selected = searchParams.c && searchParams.c !== "overall"
    ? programs.find((p) => p.externalId === searchParams.c)
    : undefined;
  const campaign = selected ? selected.externalId : "overall";

  const [board, handles] = await Promise.all([
    selected ? getCampaignLeaderboard(selected.id, window) : getOverallLeaderboard(window),
    getCreatorHandles(selected ? selected.id : null),
  ]);

  const scopeLabel = selected ? selected.name : "Overall agency";

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <div className="cup"><i className="ti ti-trophy" /></div>
          <div>
            <h1>Leaderboard</h1>
            <div className="sub">
              {scopeLabel} · top creators by views
              {staff && <span className="staff-badge">staff view</span>}
            </div>
          </div>
        </div>
        <CampaignSelect programs={programs} campaign={campaign} />
      </div>

      <div className="controls">
        <WindowSegment window={wKey} />
        <div style={{ fontSize: "12px", color: "var(--faint)" }}>
          <i className="ti ti-refresh" /> updates daily
        </div>
      </div>

      {board.warmingUp ? (
        <WarmingUp need={WINDOW_NEED[wKey]} days={board.daysOfHistory} />
      ) : board.entries.length === 0 ? (
        <p className="foot" style={{ marginTop: 48 }}>No ranked creators on this board yet.</p>
      ) : (
        <BoardBody board={board} handles={handles} youId={youId} />
      )}

      <div className="topbar" style={{ marginTop: 24, justifyContent: "flex-end" }}>
        <form action={signOut}>
          <button className="signout" type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}

type Handles = Map<string, { platform: string; handle: string }>;

function HandleLine({ entry, handles }: { entry: LeaderboardEntry; handles: Handles }) {
  const h = handles.get(entry.creatorId);
  if (!h) return null;
  const icon = PLATFORM_ICON[h.platform] ?? "ti-at";
  return (
    <>
      <i className={`ti ${icon} plat`} />@{h.handle.replace(/^@/, "")}
    </>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <div className={`av${small ? " sm" : ""}`} style={{ background: avatarGradient(name) }}>
      {initials(name)}
    </div>
  );
}

function BoardBody({ board, handles, youId }: { board: Leaderboard; handles: Handles; youId: string }) {
  const top3 = board.entries.slice(0, 3);
  const rest = board.entries.slice(3);
  const podiumOrder = [1, 0, 2]; // 2nd, 1st (center), 3rd — matches the prototype

  return (
    <>
      <div className="podium">
        {podiumOrder.map((idx) => {
          const e = top3[idx];
          if (!e) return <div key={idx} />;
          const you = e.creatorId === youId;
          return (
            <div key={idx} className={`pod p${idx + 1}${you ? " you" : ""}`}>
              {idx === 0 && <div className="crown">👑</div>}
              <div className={`medal m${idx + 1}`}>{idx + 1}</div>
              <Avatar name={e.name} />
              <div className="nm">
                {e.name}
                {you && <span className="tag">YOU</span>}
              </div>
              <div className="hd"><HandleLine entry={e} handles={handles} /></div>
              <div className="vw">{e.views.toLocaleString("en-US")}</div>
              <div className="vl">views</div>
            </div>
          );
        })}
      </div>

      <div className="list">
        {rest.map((e) => {
          const you = e.creatorId === youId;
          return (
            <div key={e.creatorId} className={`row${you ? " you" : ""}`}>
              <div className="rank">{e.rank}</div>
              <Avatar name={e.name} small />
              <div className="meta">
                <div className="nm">
                  {e.name}
                  {you && <span className="tag">YOU</span>}
                </div>
                <div className="hd"><HandleLine entry={e} handles={handles} /></div>
              </div>
              <div className="vw">{e.views.toLocaleString("en-US")}</div>
            </div>
          );
        })}
      </div>

      <div className="foot">
        Showing {board.window === "all-time" ? "all-time" : `${board.window}`} views
        {board.asOf ? ` · as of ${board.asOf}` : ""}
      </div>
    </>
  );
}

function WarmingUp({ need, days }: { need: number; days: number }) {
  return (
    <div className="screen" style={{ marginTop: "6vh" }}>
      <div className="cup"><i className="ti ti-hourglass-high" /></div>
      <h1>Warming up</h1>
      <p>
        This window needs {need} days of history to rank fairly. We have {days}{" "}
        {days === 1 ? "day" : "days"} so far — it fills in automatically as the daily
        snapshot runs. Try the <strong>All-time</strong> tab in the meantime.
      </p>
    </div>
  );
}

function UnknownEmail({ email }: { email: string }) {
  return (
    <div className="screen">
      <div className="cup"><i className="ti ti-mail-question" /></div>
      <h1>Almost there</h1>
      <p>
        We don&apos;t recognize <strong>{email}</strong> yet — DM Danny on Slack with the
        email you want to use, and we&apos;ll add you to the board.
      </p>
      <form action={signOut}>
        <button className="cta" type="submit" style={{ marginTop: 18, maxWidth: 260, marginInline: "auto" }}>
          Try a different email
        </button>
      </form>
    </div>
  );
}
