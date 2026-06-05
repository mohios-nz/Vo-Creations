import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/roi" },
  title: "UGC ROI Calculator: Compare Costs vs Influencer Marketing",
  description:
    "Calculate your UGC campaign ROI. Compare Vo Creations pricing vs influencer marketing costs. See how 180 videos across 4 platforms can cost 80% less.",
  openGraph: {
    title: "UGC ROI Calculator | Vo Creations",
    description:
      "Calculate your UGC campaign ROI and compare costs vs influencer marketing.",
    type: "website",
  },
};

export default function ROILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
