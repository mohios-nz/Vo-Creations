import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/refund-policy" },
  title: "Refund Policy",
  description:
    "Refund policy for the Vo Creations Mentorship Program and digital products. Read our terms before purchasing or enrolling.",
  openGraph: {
    title: "Refund Policy | Vo Creations",
    description:
      "Refund policy for the Vo Creations Mentorship Program and digital products. Read our terms before purchasing or enrolling.",
    url: "https://vocreations.com/refund-policy",
    siteName: "Vo Creations",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vo Creations Refund Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund Policy | Vo Creations",
    description:
      "Refund policy for the Vo Creations Mentorship Program and digital products.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
