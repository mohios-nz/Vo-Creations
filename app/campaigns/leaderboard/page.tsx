import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Creator Leaderboard · Vo Creations",
  description: "Month-to-date views across active Vo Creations campaigns.",
  robots: { index: false, follow: false },
};

interface Creator {
  rank: number;
  userId: string;
  name: string;
  handle: string;
  primaryPlatform: string;
  profileImageUrl?: string;
  mtdViews: number;
  mtdPosts: number;
  activePrograms: number;
  brands: string[];
  joinedMidMonth?: boolean;
}

interface LeaderboardData {
  updatedAt: string;
  month: string;
  topCreators: Creator[];
}

async function getLeaderboard(): Promise<LeaderboardData | null> {
  const url = process.env.LEADERBOARD_DATA_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as LeaderboardData;
    if (!Array.isArray(data?.topCreators)) return null;
    return data;
  } catch {
    return null;
  }
}

const numberFmt = new Intl.NumberFormat("en-US");

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return numberFmt.format(n);
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform?.toLowerCase() ?? "";
  const cls = "w-3.5 h-3.5";
  if (p.includes("tiktok")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.6 5.8a4.8 4.8 0 0 1-3.3-1.3 4.8 4.8 0 0 1-1.4-2.7h-3.3v13.1a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V9.05a6 6 0 0 0-.78-.05A5.9 5.9 0 1 0 14.9 14.9V8.3a8 8 0 0 0 4.7 1.5z" />
      </svg>
    );
  }
  if (p.includes("instagram")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.24a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2zm0 10.89a4.29 4.29 0 1 1 0-8.58 4.29 4.29 0 0 1 0 8.58zm6.85-11.15a1.54 1.54 0 1 1-3.08 0 1.54 1.54 0 0 1 3.08 0z" />
      </svg>
    );
  }
  if (p.includes("youtube")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ creator }: { creator: Creator }) {
  if (creator.profileImageUrl) {
    return (
      <Image
        src={creator.profileImageUrl}
        alt={creator.name}
        width={48}
        height={48}
        unoptimized
        className="w-12 h-12 rounded-full object-cover bg-bg-elevated"
      />
    );
  }
  const initials = creator.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-secondary text-sm font-semibold">
      {initials}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 rounded-2xl bg-bg-card border border-border">
      <p className="text-text font-semibold mb-2">Leaderboard is warming up</p>
      <p className="text-text-secondary text-sm max-w-xs mx-auto">
        Today&apos;s rankings are being compiled. The board refreshes every
        morning; check back shortly.
      </p>
    </div>
  );
}

export default async function LeaderboardPage() {
  const data = await getLeaderboard();
  const creators = data?.topCreators ?? [];

  return (
    <main className="min-h-screen bg-bg text-text px-5 py-12 relative overflow-hidden">
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(245,166,35,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-dim border border-border-accent rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-[1.5px] uppercase text-accent mb-5">
            Creator Leaderboard
          </div>
          <h1 className="text-[clamp(32px,7vw,48px)] font-extrabold leading-[1.05] tracking-tighter mb-3">
            {data?.month ?? "This Month"}
          </h1>
          <p className="text-text-secondary text-sm">
            Ranked by month-to-date views across active campaigns. Updated daily.
          </p>
          {data?.updatedAt && (
            <p className="text-text-dim text-xs mt-2">
              Last updated {formatUpdated(data.updatedAt)}
            </p>
          )}
        </header>

        {creators.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="space-y-2.5">
            {creators.map((c) => (
              <li
                key={c.userId}
                className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-3.5 py-3 sm:px-4"
              >
                <div
                  className={`shrink-0 w-7 text-center text-lg font-extrabold tabular-nums ${
                    c.rank <= 3 ? "text-accent" : "text-text-dim"
                  }`}
                >
                  {c.rank}
                </div>

                <Avatar creator={c} />

                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-tight truncate">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs mt-0.5">
                    <span className="text-text-dim">
                      <PlatformIcon platform={c.primaryPlatform} />
                    </span>
                    <span className="truncate">@{c.handle}</span>
                    {c.activePrograms > 1 && (
                      <span className="text-text-dim shrink-0">
                        · {c.activePrograms} campaigns
                      </span>
                    )}
                    {c.joinedMidMonth && (
                      <span className="shrink-0 text-accent/70">· new</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-bold tabular-nums leading-tight">
                    {formatViews(c.mtdViews)}
                  </div>
                  <div className="text-text-dim text-[11px] tabular-nums">
                    {numberFmt.format(c.mtdPosts)} posts
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
