import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "For Brands: UGC Campaigns That Go Viral",
  description:
    "Meet the team behind the VoC Method. 100M+ views generated, 50+ brands served. The only UGC agency with a built-in creator training pipeline.",
  openGraph: {
    title: "For Brands | Vo Creations",
    description:
      "Meet the team behind the VoC Method. The only UGC agency with a built-in creator training pipeline.",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
