// Deterministic initials avatar — identical scheme to the prototype, so the look
// matches whether or not a creator has a profile image.
const PALETTES = [
  ["#8B5CF6", "#EC4899"], ["#06B6D4", "#3B82F6"], ["#F59E0B", "#EF4444"],
  ["#10B981", "#14B8A6"], ["#F472B6", "#A855F7"], ["#22D3EE", "#6366F1"],
  ["#FB923C", "#F43F5E"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function avatarGradient(name: string): string {
  const [a, b] = PALETTES[hash(name) % PALETTES.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export const PLATFORM_ICON: Record<string, string> = {
  tiktok: "ti-brand-tiktok",
  instagram: "ti-brand-instagram",
  youtube: "ti-brand-youtube",
};
