export const metadata = {
  alternates: { canonical: "/blog/text-on-screen-ugc" },
  title: "Why Text-On-Screen UGC Is Killing Your App Growth | Vo Creations",
  description:
    "Everyone is producing UGC. Almost nobody is getting results. 20M+ views, 3 creators, $10K campaign cost. Here's what actually works.",
  openGraph: {
    title: "Why Text-On-Screen UGC Is Killing Your App Growth",
    description:
      "Everyone is producing UGC. Almost nobody is getting results.",
    images: [
      {
        url: "/blog/text-vs-talking.jpg",
        width: 2048,
        height: 819,
        alt: "Text-on-screen vs talking-head UGC comparison",
      },
    ],
    type: "article",
    publishedTime: "2026-03-24T00:00:00Z",
    authors: ["Thienvu Vo"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Text-On-Screen UGC Is Killing Your App Growth",
    description:
      "Everyone is producing UGC. Almost nobody is getting results.",
    images: ["/blog/text-vs-talking.jpg"],
  },
};

export default function ArticleLayout({ children }) {
  return children;
}
