import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  alternates: { canonical: "/pre-call" },
  title: "VoCreations - UGC Mentorship",
  description:
    "Learn how to scale to $10K/month in 120 days by leveraging your UGC skills to go viral with Vo Creations.",
  openGraph: {
    title: "VoCreations - UGC Mentorship",
    description:
      "Learn how to scale to $10K/month in 120 days by leveraging your UGC skills to go viral with Vo Creations.",
    type: "website",
  },
};

export default function PreCallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={inter.variable}>{children}</div>;
}
