"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Label from "@/components/Label";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import Image from "next/image";
import Link from "next/link";

const team = [
  {
    name: "Thienvu Vo",
    role: "CEO & Founder",
    bio: "From 3 minimum-wage jobs to 100M+ views. Built Vo Creations from scratch.",
    initials: "TV",
    image: "/videos/team-thienvu.jpg",
  },
  {
    name: "Danny Holtschke",
    role: "COO / CRO",
    bio: "AI Ops, sales, growth, and operations. Scales the agency.",
    initials: "DH",
    image: "/videos/team-danny.png",
  },
  {
    name: "Daniel Yun",
    role: "CCO (Chief Creative Officer)",
    bio: "Self-taught. 100M+ views. 6-figure earner. Creative force behind Vo Creations.",
    initials: "DY",
    image: "/videos/team-daniel.jpg",
  },
];


const differentiators = [
  {
    num: "01",
    title: "We train our own creators",
    desc: "Every creator went through our mentorship. They know our system, standards, and formats.",
  },
  {
    num: "02",
    title: "Talking-head only",
    desc: "15-40 seconds. Real face, real voice. No text-on-screen. That's what converts.",
  },
  {
    num: "03",
    title: "The VoC Method",
    desc: "Test 7 formats, cut the bottom 4, triple down on winners. Applied to every client.",
  },
  {
    num: "04",
    title: "Quality over quantity",
    desc: "10 new campaigns per month. Not 100. Every client gets senior attention.",
  },
];

const verticalVideos = [
  { label: "My Story", src: "/videos/my-story.mp4", postUrl: "https://www.instagram.com/itsthienvuvo/reel/DOhA4Sakaku/" },
  { label: "Creator success", src: "/videos/creator-success.mp4", postUrl: "https://www.instagram.com/reel/DKucBvzMHbK/" },
  { label: "Creator example", src: "/videos/creator-example.mp4", postUrl: "https://www.instagram.com/reels/DHJSBnYO2As/" },
];

const networkVideos = [
  { src: "/videos/post-1.mp4", views: "3.8M", postUrl: "https://www.instagram.com/p/DTFU5uGjgqV/" },
  { src: "/videos/post-2.mp4", views: "3.7M", postUrl: "https://www.instagram.com/p/DTRCvh2E1Lu/" },
  { src: "/videos/post-3.mp4", views: "2.9M", postUrl: "https://www.instagram.com/p/DTGTfgsGI62/" },
  { src: "/videos/post-4.mp4", views: "1.5M", postUrl: "https://www.instagram.com/p/DUMI_NwD0Xa/" },
];

const marketStats = [
  { num: "$10B+", text: "US UGC spend 2025", source: "↑ 11% YoY" },
  { num: "93%", text: "of marketers say UGC outperforms traditional ads", source: "Brand adoption" },
  { num: "6.9×", text: "more engagement than brand-created content", source: "vs branded content" },
];

const marketStats2 = [
  { num: "30-80%", text: "cheaper than influencer marketing", source: "Cost savings" },
  { num: "93%", text: "creator supply growth 2024-25", source: "Market growth" },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="pt-[160px] pb-16 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <Label>For brands</Label>
          <h1 className="text-[clamp(32px,5vw,52px)] font-black leading-[1.05] tracking-tighter mb-6">
            The mentorship that<br />
            became an <span className="text-accent">agency</span>
          </h1>
          <p className="text-[clamp(16px,2vw,19px)] text-text-secondary max-w-[520px] mx-auto leading-relaxed">
            From 3 minimum-wage jobs to 100+ creators and 50+ brands.
          </p>
        </div>
      </section>

      {/* VIDEO SECTION */}
      <section className="pb-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>Watch the story</Label>

          {/* Main YouTube video */}
          <div className="mb-5">
            <YouTubeEmbed
              videoId="xL3zWBso9mw"
              title="Thienvu: How I built Vo Creations"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {verticalVideos.map((v) => (
              <div
                key={v.label}
                className="bg-bg-card rounded-2xl overflow-hidden border border-border"
              >
                <div className="relative aspect-[9/16]">
                  <video
                    src={`${v.src}#t=0.1`}
                    playsInline
                    muted
                    loop
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                    onMouseEnter={(e) => { const el = e.currentTarget; el.play(); }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.pause(); el.currentTime = 0.1; }}
                    onClick={(e) => { e.currentTarget.muted = !e.currentTarget.muted; }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {v.label}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm cursor-pointer">
                      Tap to unmute
                    </span>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-end">
                  <a
                    href={v.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    View on Instagram ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* OUR NETWORK */}
      <section className="py-[100px] px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="max-w-[720px] mx-auto text-center mb-10">
            <Label>Our network</Label>
            <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
              100+ trained creators.{" "}
              <span className="text-accent">500M+ views</span> and counting.
            </h2>
            <p className="text-base text-text-secondary">
              Every creator trained through our mentorship. No freelancers. No marketplace.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {networkVideos.map((v) => (
              <div
                key={v.src}
                className="bg-bg-card rounded-2xl overflow-hidden border border-border"
              >
                <div className="relative aspect-[9/16]">
                  <video
                    src={`${v.src}#t=0.1`}
                    playsInline
                    muted
                    loop
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                    onMouseEnter={(e) => { const el = e.currentTarget; el.play(); }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.pause(); el.currentTime = 0.1; }}
                    onClick={(e) => { e.currentTarget.muted = !e.currentTarget.muted; }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[13px] font-bold text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {v.views} views
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm cursor-pointer">
                      Tap to unmute
                    </span>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-end">
                  <a
                    href={v.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    View post ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* THE MARKET */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>The market</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            UGC is eating{" "}
            <span className="text-accent">marketing budgets</span>
          </h2>
          <p className="text-base text-text-secondary mb-10">
            Source: Mordor Intelligence, Fortune Insights, Whop,
            InfluencerMarketingHub 2026
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {marketStats.map((s) => (
              <div
                key={s.num}
                className="group relative bg-bg-card rounded-2xl p-7 border border-border hover:border-accent/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-[36px] font-black text-accent tracking-tight leading-none">
                    {s.num}
                  </div>
                  <div className="text-[13px] text-text-secondary mt-3 leading-snug">
                    {s.text}
                  </div>
                  <div className="text-[10px] text-accent/60 tracking-wide uppercase mt-2.5 font-semibold">
                    {s.source}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {marketStats2.map((s) => (
              <div
                key={s.num}
                className="group relative bg-bg-card rounded-2xl p-7 border border-border hover:border-accent/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-[36px] font-black text-accent tracking-tight leading-none">
                    {s.num}
                  </div>
                  <div className="text-[13px] text-text-secondary mt-3 leading-snug">
                    {s.text}
                  </div>
                  <div className="text-[10px] text-accent/60 tracking-wide uppercase mt-2.5 font-semibold">
                    {s.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* UGC + PAID ADS */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>UGC + paid ads</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            UGC isn&apos;t a replacement.{" "}
            <span className="text-accent">It&apos;s the multiplier.</span>
          </h2>
          <p className="text-base text-text-secondary mb-10">
            UGC is top-of-funnel. A compounding brand engine. Your attention layer that makes everything else in your marketing stack convert better.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h4 className="text-[15px] font-bold mb-3">Without UGC</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Paid ads with branded creative</li>
                <li>Declining engagement, rising CPMs</li>
                <li>No organic discovery layer</li>
                <li>Cold audiences, hard conversions</li>
              </ul>
            </div>
            <div className="bg-accent/[0.04] rounded-2xl p-6 border border-accent/20">
              <h4 className="text-[15px] font-bold mb-3 text-accent">With UGC</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Organic videos warm up audiences at scale</li>
                <li>Paid ads retarget viewers who already know you</li>
                <li>App Store / Google searches compound</li>
                <li>Word-of-mouth kicks in naturally</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* TEAM */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>The team</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Small team. Senior operators.
          </h2>
          <p className="text-base text-text-secondary mb-10">
            The people who built the system run your campaign.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.map((t) => (
              <div
                key={t.name}
                className="bg-bg-card rounded-2xl p-6 border border-border flex gap-4 items-start"
              >
                <div className="w-16 h-16 min-w-[64px] rounded-xl overflow-hidden bg-bg-elevated">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[17px] font-bold">{t.name}</div>
                  <div className="text-xs text-accent font-semibold mt-0.5 mb-2">
                    {t.role}
                  </div>
                  <div className="text-sm text-text-secondary leading-relaxed">
                    {t.bio}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* DIFFERENTIATORS */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>What makes us different</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-10">
            Four things nobody else does.
          </h2>

          <div className="flex flex-col gap-5">
            {differentiators.map((d) => (
              <div key={d.num} className="flex gap-5 items-start">
                <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
                  {d.num}
                </div>
                <div>
                  <h4 className="text-[17px] font-bold tracking-tight mb-1">
                    {d.title}
                  </h4>
                  <p className="text-[15px] text-text-secondary leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 bg-bg-card">
        <h3 className="text-[28px] font-extrabold tracking-tight mb-3">
          Want to work with us?
        </h3>
        <p className="text-base text-text-secondary mb-6">
          Whether you&apos;re a brand or a future creator, let&apos;s talk.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://calendar.app.google/BMAP5qH6Qwtkm5Yr5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Apply for a campaign &rarr;
          </a>
          <Link
            href="/mentorship"
            className="inline-flex items-center gap-2 bg-transparent text-text font-medium text-base px-9 py-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all"
          >
            Become a creator &rarr;
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
