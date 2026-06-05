import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  campaignMeta,
  headlineMetrics,
  creators,
  platforms,
  dailyViews,
  topPosts,
  formatNumber,
} from "./data";
import { HeroMetric } from "./components/HeroMetric";
import { CreatorCard } from "./components/CreatorCard";
import { PlatformBar } from "./components/PlatformBar";
import { ViewsChart } from "./components/ViewsChart";
import { PostCard } from "./components/PostCard";

export const metadata: Metadata = {
  title: "Maxxd Campaign · Vo Creations",
  description:
    "How Vo Creations drove 575K+ organic views for a fitness app in 26 days, without paid media. Real creators, real numbers, real posts.",
  openGraph: {
    title: "Maxxd Campaign Case Study · Vo Creations",
    description:
      "575K+ organic views. 262 posts. 6 creators. Zero paid spend. See the full campaign breakdown.",
    type: "article",
    images: [{ url: "/og/maxxd.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maxxd Campaign · Vo Creations",
    description:
      "575K+ organic views for a fitness app in 26 days, no paid media.",
    images: ["/og/maxxd.png"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Maxxd Campaign Case Study: 575K+ Organic Views in 26 Days",
  description:
    "How Vo Creations drove 575K+ organic views for a fitness app launch using 6 trained UGC creators across 4 platforms, without paid media.",
  author: {
    "@type": "Organization",
    name: "Vo Creations",
    url: "https://vocreations.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Vo Creations",
    url: "https://vocreations.com",
  },
  datePublished: "2026-04-14",
  image: "https://vocreations.com/og/maxxd.png",
};

export default function MaxxdCampaignPage() {
  const maxPlatformViews = Math.max(...platforms.map((p) => p.views));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Nav />

      <main className="min-h-screen bg-bg">
        {/* ─── HERO ─── */}
        <section className="pt-32 pb-16 px-5 sm:px-8 max-w-5xl mx-auto">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-text-secondary mb-6">
            Campaign Case Study · {campaignMeta.month}
          </p>
          <h1 className="font-outfit text-5xl sm:text-7xl md:text-8xl font-black text-text leading-[0.95] mb-4">
            Maxxd
          </h1>
          <p className="font-outfit text-lg sm:text-xl text-accent font-medium mb-4">
            30-day UGC launch campaign · 4 platforms · 6 creators
          </p>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed mb-8">
            How Vo Creations drove 575K+ organic views for a fitness app in 26
            days, without paid media.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-text-dim">
            <span>Client: {campaignMeta.type}</span>
            <span className="text-text-dim/40">·</span>
            <span>Status: {campaignMeta.status}</span>
            <span className="text-text-dim/40">·</span>
            <span>Day {campaignMeta.day} of {campaignMeta.totalDays}</span>
            <span className="text-text-dim/40">·</span>
            <span>Data as of {campaignMeta.dataAsOf}</span>
          </div>
        </section>

        {/* ─── HEADLINE METRICS ─── */}
        <section className="border-y border-border px-5 sm:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {headlineMetrics.map((m) => (
              <HeroMetric
                key={m.label}
                value={m.value}
                label={m.label}
                caption={m.caption}
              />
            ))}
          </div>
        </section>

        {/* ─── NARRATIVE ─── */}
        <section className="py-20 px-5 sm:px-8 max-w-3xl mx-auto">
          <div className="space-y-5 text-[15px] sm:text-base text-text-secondary leading-relaxed">
            <p>
              Maxxd is a fitness app launching into a crowded market. The brief:
              drive awareness and app installs through organic UGC only. No paid
              media, no influencer fees, no agency retainers.
            </p>
            <p>
              Vo Creations deployed 6 trained creators across Instagram, TikTok,
              YouTube, and Facebook, running a 30-day iterative campaign using the
              VoC Method: test formats in week 1, find the winning hooks, and
              triple down. By day 26, the campaign had generated 575K+ organic
              views, 262 posts, and over 9,700 engagements, with zero paid
              spend.
            </p>
            <p className="text-text font-medium">
              This page shows the real numbers, the real creators, and the posts
              that won.
            </p>
          </div>
        </section>

        {/* ─── CREATOR TRACKER ─── */}
        <section className="py-16 px-5 sm:px-8 max-w-5xl mx-auto">
          <div className="flex items-baseline gap-3 mb-10">
            <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-text">
              Creator Tracker
            </h2>
            <span className="font-mono text-xs text-text-dim">
              {creators.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creators.map((c) => (
              <CreatorCard key={c.name} creator={c} />
            ))}
          </div>
        </section>

        {/* ─── PLATFORM BREAKDOWN ─── */}
        <section className="py-16 px-5 sm:px-8 max-w-5xl mx-auto">
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-text mb-10">
            Platform Breakdown
          </h2>
          <div className="space-y-4">
            {platforms.map((p) => (
              <PlatformBar
                key={p.name}
                platform={p}
                maxViews={maxPlatformViews}
              />
            ))}
          </div>
          <p className="font-mono text-xs text-text-dim mt-8 max-w-xl">
            YouTube Shorts led the campaign with 59% of total views. Proof that
            Shorts remain the dark horse of organic UGC distribution.
          </p>
        </section>

        {/* ─── DAILY VIEWS ─── */}
        <section className="py-16 px-5 sm:px-8 max-w-5xl mx-auto">
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-text mb-8">
            Daily Views
          </h2>
          <div className="bg-bg-card border border-border rounded-xl p-4 sm:p-6">
            <ViewsChart data={dailyViews} />
          </div>
        </section>

        {/* ─── TOP POSTS ─── */}
        <section className="py-16 px-5 sm:px-8 max-w-5xl mx-auto">
          <div className="flex items-baseline gap-3 mb-10">
            <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-text">
              Top Posts
            </h2>
            <span className="font-mono text-xs text-text-dim">
              by views
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPosts.map((post) => (
              <PostCard key={post.rank} post={post} />
            ))}
          </div>
        </section>

        {/* ─── VOC METHOD ─── */}
        <section className="py-20 px-5 sm:px-8 max-w-3xl mx-auto">
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-text mb-12">
            The VoC Method
          </h2>
          <div className="space-y-10">
            {[
              {
                num: "01",
                title: "Train, don't hire.",
                body: "6 creators from VoC's in-house mentorship network, trained on talking-head storytelling, hook iteration, and platform-native format. No marketplace randoms.",
              },
              {
                num: "02",
                title: "Test, then triple down.",
                body: "Week 1 = test 7 formats across 4 platforms. Week 2–4 = cut the bottom 4, pour energy into the winners. Iterate hooks in 1–2 word increments.",
              },
              {
                num: "03",
                title: "Distribute everywhere, optimize per platform.",
                body: "One idea → adapted for TikTok, Instagram Reels, YouTube Shorts, and Facebook. Talking-head only. Never text-on-screen.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-accent shrink-0 w-12">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-outfit text-base sm:text-lg font-bold text-text mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-text-secondary leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 px-5 sm:px-8 max-w-5xl mx-auto">
          <div className="border border-accent/30 rounded-2xl p-8 sm:p-12 text-center bg-accent/[0.03]">
            <h2 className="font-outfit text-2xl sm:text-3xl md:text-4xl font-bold text-text mb-4">
              Want numbers like this for your product?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8">
              Vo Creations runs 10 new UGC campaigns per month. We don&apos;t
              hire creators. We build them.
            </p>
            <a
              href="/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-bg font-outfit font-semibold rounded-lg hover:bg-accent-light transition-colors duration-200"
            >
              Apply for a campaign slot
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
