import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/creators" },
  title: "Our Creator Network: Trained UGC Creators",
  description:
    "Browse Vo Creations' trained creator network. Every creator completes a 2-month mentorship before joining campaigns. 100M+ combined views.",
  openGraph: {
    title: "Creator Network | Vo Creations",
    description:
      "Trained UGC creators ready for your campaign. Every creator completes a 2-month mentorship.",
    type: "website",
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
