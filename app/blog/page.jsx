"use client";
import Link from "next/link";
import BlogNav from "@/components/blog/BlogNav";
import XPostEmbed from "@/components/blog/XPostEmbed";

const t = {
  bg: "#0F0D0B",
  surface: "#1A1714",
  accent: "#F5A623",
  text: "#F5EDE3",
  textSecondary: "#9A9088",
  textDim: "#6B6558",
  border: "rgba(255,255,255,0.06)",
  display: "'Outfit', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const xPosts = [
  {
    url: "https://x.com/itsthienvuvo/status/2036103378099376588",
    author: "Thienvu Vo",
    handle: "@itsthienvuvo",
    date: "March 23, 2026",
    content: "Why text-on-screen UGC is killing your app growth:\n\nI've managed 30+ creator campaigns generating 100M+ views.\n\n99% of brands are doing UGC wrong. They hire creators to make text-on-screen videos that get 2K views and zero conversions.\n\nHere's what actually works (thread) \u{1F9F5}",
  },
  {
    url: "https://x.com/itsthienvuvo/status/2036105952827469983",
    author: "Thienvu Vo",
    handle: "@itsthienvuvo",
    date: "March 23, 2026",
    content: "every time i've challenged an agency owner about text-on-screen videos, they got super defensive\n\ni don't believe they work, and have yet to hear a good reason why they do.\n\nalways willing to learn, like genuinely",
  },
  {
    url: "https://x.com/VoCreationsUGC/status/2035015697609191440",
    author: "Vo Creations",
    handle: "@VoCreationsUGC",
    date: "March 20, 2026",
    content: "dream come true :)\n\namazing students, amazing campaigns.",
    hasVideo: true,
  },
  {
    url: "https://x.com/itsthienvuvo/status/2034305615196008619",
    author: "Thienvu Vo",
    handle: "@itsthienvuvo",
    date: "March 18, 2026",
    content: "most bootstrapped founders treat UGC like a paid ad. run it once, check the conversion, move on.\n\nthat's the wrong mental model entirely\n\nUGC is a compounding machine. you're not running one ad. you're running 300 experiments simultaneously until you find the format that converts, then you pour money behind it\n\nthe founders who get this are turning organic content into their highest performing paid ads\n\nthe ones who don't are wondering why it's \"not working\" after 2 weeks",
  },
  {
    url: "https://x.com/itsthienvuvo/status/2014355079906664586",
    author: "Thienvu Vo",
    handle: "@itsthienvuvo",
    date: "February 2026",
    content: "i scaled my UGC agency to 100K/month in 2 months.\n\nhere's how, full transparency:\n\nweek 1 → notified mentorship students about the upcoming agency deal flow. mass outreach to connect and learn from existing agencies + nurturing current connections with the biggest in the space\n\nweek 2 → landed 2 clients (40K/month) through IG personal brand inbounds. built fulfilment system (notion + discord) to ensure we go viral for clients\n\nweek 3 → landed 1 client (10K/month) through a referral. started going viral with all clients and had creators double down on winning formats\n\nweek 4 → built case studies: fable, 15M views in 21 days with 3 creators. averaged over 10M views/month for clients\n\nweek 5 → started posting on x and landed an equity deal with an app. hired 2 creator managers to help us scale our campaigns\n\nweek 6 → focused on team management and instilled ownership in creator managers\n\nweek 7 → referred 3 more deals (30K/month) because they saw our performance and how different we worked\n\nweek 8 → expanded our creator manager team to 5. everyone's excited to scale up, and this is just the start.",
  },
];

export default function BlogIndex() {
  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.text }}>
      <BlogNav />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 24px 40px" }}>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: t.accent,
            marginBottom: "16px",
          }}
        >
          Blog
        </div>
        <h1
          style={{
            fontFamily: t.display,
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 48px)",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            color: t.text,
            marginBottom: "48px",
          }}
        >
          Insights
        </h1>

        <Link href="/blog/text-on-screen-ugc" style={{ textDecoration: "none", color: "inherit" }}>
          <article
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
              padding: "0",
              overflow: "hidden",
              transition: "border-color 0.3s ease, transform 0.3s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
              <img
                src="/blog/text-vs-talking.jpg"
                alt="Text-on-screen vs talking-head UGC"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <div style={{ padding: "24px 32px 32px" }}>
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: t.textDim,
                  marginBottom: "12px",
                }}
              >
                March 2026 · 5 min read
              </div>
              <h2
                style={{
                  fontFamily: t.display,
                  fontWeight: 800,
                  fontSize: "24px",
                  letterSpacing: "-1px",
                  lineHeight: 1.2,
                  color: t.text,
                  marginBottom: "8px",
                }}
              >
                Why Text-On-Screen UGC Is Killing Your App Growth
              </h2>
              <p
                style={{
                  fontFamily: t.body,
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: t.textSecondary,
                  margin: 0,
                }}
              >
                Everyone is producing UGC. Almost nobody is getting results.
              </p>
            </div>
          </article>
        </Link>
      </div>

      {/* X POSTS SECTION */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: t.accent,
            marginBottom: "16px",
          }}
        >
          On X
        </div>
        <h2
          style={{
            fontFamily: t.display,
            fontWeight: 900,
            fontSize: "clamp(24px, 4vw, 36px)",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            color: t.text,
            marginBottom: "32px",
          }}
        >
          Latest from Thienvu
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {xPosts.map((post) => (
            <XPostEmbed
              key={post.url}
              url={post.url}
              author={post.author}
              handle={post.handle}
              date={post.date}
              content={post.content}
              avatar={post.handle === "@VoCreationsUGC" ? "/VoCreations Logo.webp" : undefined}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}
