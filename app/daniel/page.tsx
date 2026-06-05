import type { Metadata } from "next";
import SaaStrLanding from "@/components/SaaStrLanding";

export const metadata: Metadata = {
  title: "Daniel · VoCreations · SaaStr Annual 2026",
  description: "Met Daniel at SaaStr Annual 2026? Learn how VoCreations runs B2C2B UGC for SaaS brands.",
  alternates: { canonical: "/daniel" },
  robots: { index: false, follow: true },
};

export default function DanielPage() {
  return <SaaStrLanding name="Daniel" slug="daniel" />;
}
