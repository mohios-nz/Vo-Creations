import type { Creator } from "../data";
import { formatNumber } from "../data";
import { StatusPill } from "./StatusPill";
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon } from "./PlatformIcon";

const platformLinks: { key: keyof Creator["profiles"]; Icon: typeof InstagramIcon; label: string }[] = [
  { key: "instagram", Icon: InstagramIcon, label: "Instagram" },
  { key: "tiktok", Icon: TikTokIcon, label: "TikTok" },
  { key: "youtube", Icon: YouTubeIcon, label: "YouTube" },
  { key: "facebook", Icon: FacebookIcon, label: "Facebook" },
];

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 hover:border-border-accent transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-outfit text-lg font-bold text-text">{creator.name}</h3>
          {creator.handle && (
            <p className="font-mono text-xs text-text-secondary mt-0.5">{creator.handle}</p>
          )}
        </div>
        <StatusPill status={creator.status} />
      </div>

      <div className="flex items-center gap-2 mb-5">
        {platformLinks.map(({ key, Icon, label }) => {
          const url = creator.profiles[key];
          if (!url) return (
            <span key={key} className="text-text-dim/30" title={`${label}: not active`}>
              <Icon className="w-4 h-4" />
            </span>
          );
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-accent transition-colors"
              title={label}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
        <span className="ml-auto font-mono text-[11px] text-text-dim">{creator.tier}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Posts", value: creator.posts },
          { label: "Videos", value: creator.uniqueVideos },
          { label: "Views", value: creator.totalViews },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-mono text-lg font-semibold text-text">{formatNumber(stat.value)}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
