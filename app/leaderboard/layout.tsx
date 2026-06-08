import type { Metadata } from "next";
import { Anton, Outfit } from "next/font/google";
import "./leaderboard.css";

// The fun leaderboard fonts (prototype: Anton display + Outfit body), exposed as
// CSS vars the lifted stylesheet references.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-outfit" });

// Gated, internal-ish creator surface — never index it.
export const metadata: Metadata = {
  title: "Creator Leaderboard",
  robots: { index: false, follow: false },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lb-root ${anton.variable} ${outfit.variable}`}>{children}</div>;
}
