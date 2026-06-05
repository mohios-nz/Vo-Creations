import { Outfit, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  alternates: { canonical: "/mentorship" },
  title: "Vo Creators: UGC Creator Mentorship Program",
  description:
    "Get paid to create UGC content for real brands. No followers needed. No experience required. 2-month live mentorship, then join paid campaigns. Apply now.",
  openGraph: {
    title: "Vo Creators: UGC Creator Mentorship",
    description:
      "Get paid to create content for real brands. 2-month live mentorship, then join paid campaigns.",
    type: "website",
  },
};

export default function MentorshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${outfit.variable} ${jetbrainsMono.variable} font-outfit`}
      style={{
        // Override agency theme with mentorship green theme
        // Using CSS custom properties for the mentorship-specific values
        ["--m-bg" as string]: "#0a0a0a",
        ["--m-card" as string]: "#111111",
        ["--m-elevated" as string]: "#1a1a1a",
        ["--m-accent" as string]: "#5cff7e",
        ["--m-accent-dim" as string]: "rgba(92,255,126,0.08)",
        ["--m-accent-glow" as string]: "rgba(92,255,126,0.4)",
        ["--m-cyan" as string]: "#5ce1ff",
        ["--m-text" as string]: "#f5f5f5",
        ["--m-text-secondary" as string]: "#9ca3af",
        ["--m-text-dim" as string]: "#555",
        ["--m-border" as string]: "rgba(255,255,255,0.06)",
        ["--m-border-accent" as string]: "rgba(92,255,126,0.15)",
      }}
    >
      {children}
    </div>
  );
}
