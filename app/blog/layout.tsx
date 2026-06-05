import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "UGC Insights & Strategy Blog",
  description:
    "Insights on UGC strategy, talking-head content, creator training, and organic-to-paid amplification from the Vo Creations team.",
  openGraph: {
    title: "UGC Blog | Vo Creations",
    description:
      "Insights on UGC strategy, talking-head content, and creator training.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
