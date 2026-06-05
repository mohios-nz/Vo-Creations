import type { Metadata } from "next";
import SaaStrLanding from "@/components/SaaStrLanding";

export const metadata: Metadata = {
  title: "Danny · VoCreations · SaaStr Annual 2026",
  description: "Met Danny at SaaStr Annual 2026? Learn how VoCreations runs B2C2B UGC for SaaS brands.",
  alternates: { canonical: "/danny" },
  robots: { index: false, follow: true },
};

export default function DannyPage() {
  return <SaaStrLanding name="Danny" slug="danny" />;
}
