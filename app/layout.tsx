import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Vo Creations: UGC Agency for Startups & Consumer Apps",
    template: "%s | Vo Creations",
  },
  description:
    "Vo Creations is a UGC agency that trains its own creators through live mentorship. 180 talking-head videos across 4 platforms. 9 days to launch. 100M+ views generated for brands like Fable, Cluely, and Codedex.",
  metadataBase: new URL("https://vocreations.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Vo Creations: Make Them Remember.",
    description:
      "Trained creators. Proven formats. Predictable virality. The only UGC agency that builds its own creator supply chain through mentorship.",
    siteName: "Vo Creations",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vo Creations: make them remember.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vo Creations: Make Them Remember.",
    description:
      "The only UGC agency that trains its own creators. 180 videos, 4 platforms, 9 days to launch.",
    images: ["/og-image.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vo Creations",
  url: "https://vocreations.com",
  logo: "https://vocreations.com/VoCreations Logo.webp",
  description:
    "UGC agency that trains its own creators through live mentorship. Specializing in talking-head storytelling for AI startups and consumer apps.",
  founder: {
    "@type": "Person",
    name: "Thienvu Vo",
    url: "https://x.com/itsthienvuvo",
  },
  sameAs: [
    "https://x.com/VoCreationsUGC",
    "https://www.instagram.com/itsthienvuvo/",
    "https://www.tiktok.com/@itsthienvuvo",
    "https://www.youtube.com/@itsthienvuvo",
    "https://www.linkedin.com/company/vocreations",
  ],
  knowsAbout: [
    "User-Generated Content",
    "UGC Agency",
    "TikTok Marketing",
    "Creator Training",
    "Talking-Head UGC",
    "UGC for Startups",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vo Creations",
  url: "https://vocreations.com",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1TESF8060F" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-1TESF8060F');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} font-sans bg-bg text-text antialiased overflow-x-hidden`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
