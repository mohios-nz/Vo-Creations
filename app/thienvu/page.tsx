import type { Metadata } from "next";
import SaaStrLanding from "@/components/SaaStrLanding";

export const metadata: Metadata = {
  title: "Thienvu · VoCreations · SaaStr Annual 2026",
  description: "Met Thienvu at SaaStr Annual 2026? Learn how VoCreations runs B2C2B UGC for SaaS brands.",
  alternates: { canonical: "/thienvu" },
  robots: { index: false, follow: true },
};

export default function ThienVuPage() {
  return <SaaStrLanding name="Thienvu" slug="thienvu" />;
}
