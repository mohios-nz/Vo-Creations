"use client";

import { useRouter, useSearchParams } from "next/navigation";

function useGo() {
  const router = useRouter();
  const params = useSearchParams();
  return (next: { c?: string; w?: string }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.c !== undefined) sp.set("c", next.c);
    if (next.w !== undefined) sp.set("w", next.w);
    router.push(`/leaderboard?${sp.toString()}`);
  };
}

export function CampaignSelect({
  programs,
  campaign,
}: {
  programs: { externalId: string; name: string }[];
  campaign: string;
}) {
  const go = useGo();
  return (
    <select
      className="lb-select"
      value={campaign}
      onChange={(e) => go({ c: e.target.value })}
      aria-label="Campaign"
    >
      <option value="overall">Overall agency</option>
      {programs.map((p) => (
        <option key={p.externalId} value={p.externalId}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

const WINDOWS = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "All-time" },
];

export function WindowSegment({ window }: { window: string }) {
  const go = useGo();
  return (
    <div className="seg">
      {WINDOWS.map((w) => (
        <button key={w.key} className={w.key === window ? "on" : ""} onClick={() => go({ w: w.key })} type="button">
          {w.label}
        </button>
      ))}
    </div>
  );
}
