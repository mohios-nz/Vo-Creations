"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CTABlock from "@/components/CTABlock";
import Label from "@/components/Label";
import ResultCard from "@/components/ResultCard";

const steps = [
  {
    num: "01",
    title: "Apply and qualify",
    desc: "We review your product, audience, and goals. Not every brand is a fit, and we'll be honest about it.",
    time: "Day 1",
  },
  {
    num: "02",
    title: "Strategy + creator matching",
    desc: "Campaign brief, format strategy, handpicked creators from our trained network. Not a marketplace.",
    time: "Days 1-2",
  },
  {
    num: "03",
    title: "Account warmup + launch",
    desc: "Creators warm up accounts and go live. 180 videos across TikTok, Instagram, YouTube, and Facebook.",
    time: "Days 3-9",
  },
  {
    num: "04",
    title: "Optimize with the VoC Method",
    desc: "Weekly format testing: try 7 formats, cut the bottom 4, triple down on winners. The methodology behind our 24M-view campaign.",
    time: "Ongoing weekly",
  },
  {
    num: "05",
    title: "Review + scale",
    desc: "Monthly performance review with your team. What's working, what's next, whether to scale up.",
    time: "Month end",
  },
];

const showcaseVideos = [
  { src: "/videos/post-1.mp4", views: "3.8M", likes: "306K", engagement: "7.98%", postUrl: "https://www.instagram.com/p/DTFU5uGjgqV/" },
  { src: "/videos/post-2.mp4", views: "3.7M", likes: "189K", engagement: "5.10%", postUrl: "https://www.instagram.com/p/DTRCvh2E1Lu/" },
  { src: "/videos/post-3.mp4", views: "2.9M", likes: "152K", engagement: "5.36%", postUrl: "https://www.instagram.com/p/DTGTfgsGI62/" },
  { src: "/videos/post-4.mp4", views: "1.5M", likes: "59.6K", engagement: "4.91%", postUrl: "https://www.instagram.com/p/DUMI_NwD0Xa/" },
];

const agencyFaqs = [
  { q: "How many creators will be on my campaign?", a: "3 vetted creators for Starter, 6 for Growth. Every creator is trained through our mentorship. No freelancers." },
  { q: "What platforms do you post on?", a: "TikTok, Instagram Reels, YouTube Shorts, and Facebook. All four platforms, simultaneously." },
  { q: "How quickly can a campaign start?", a: "9 days from signed contract to first videos going live. Strategy and creator matching happen in Days 1-2." },
  { q: "What happens if creators underperform?", a: "We cut underperformers and replace them. That's the VoC Method. Test 7 formats, keep the winners, triple down." },
  { q: "Do you guarantee views or conversions?", a: "Yes. 1,000,000 organic views minimum, or 50% of your fee back. Only organic views count toward the guarantee, no paid views. We don't fake attribution or promise conversion rates we can't prove." },
  { q: "How is this different from hiring freelance creators?", a: "Our creators are trained through a 2-month mentorship. They know our format system, they've been tested, and they work as a coordinated team, not solo freelancers." },
  { q: "Can I see examples of past campaigns?", a: "Yes. Check the Results section above. We're happy to walk through case studies on a call." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: agencyFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Nav />

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-[140px] pb-20 relative overflow-hidden">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(245,166,35,0.04)_0%,transparent_60%)] pointer-events-none" />

        <h1 className="text-[clamp(36px,6vw,68px)] font-extrabold leading-[1.05] tracking-tighter mb-6 animate-fade-up-delay-1">
          We don&apos;t hire creators.
          <br />
          We <span className="text-accent">build</span> them.
        </h1>

        <p className="text-[clamp(16px,2.2vw,20px)] text-text-secondary max-w-[540px] leading-relaxed mb-10 animate-fade-up-delay-2">
          Trained creators. Proven formats. Predictable virality.
          The only UGC agency that builds its own creator supply chain.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up-delay-3">
          <a
            href="https://calendar.app.google/BMAP5qH6Qwtkm5Yr5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Apply for a campaign slot →
          </a>
          <a
            href="#results"
            className="inline-flex items-center gap-2 bg-transparent text-text font-medium text-base px-9 py-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all"
          >
            See results →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:gap-14 mt-[64px] sm:mt-[72px] w-full max-w-[320px] sm:w-auto sm:max-w-none mx-auto animate-fade-up-delay-4">
          {[
            ["100M+", "Views generated"],
            ["30+", "Brands scaled"],
            ["100+", "Trained creators"],
            ["9", "Days to launch"],
          ].map(([num, lbl], i) => (
            <div
              key={lbl}
              className={`text-center py-6 sm:py-0 ${
                i % 2 === 0 ? "border-r border-border sm:border-r-0" : ""
              } ${i < 2 ? "border-b border-border sm:border-b-0" : ""}`}
            >
              <div className="text-[28px] sm:text-[32px] font-extrabold tracking-tighter leading-none">
                {num}
              </div>
              <div className="text-[11px] font-medium text-text-dim tracking-wide uppercase mt-2">
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT THAT GOES VIRAL */}
      <section className="py-[100px]">
        <div className="max-w-[1100px] mx-auto px-6">
          <Label>Our work</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Content that goes <span className="text-accent">viral</span>
          </h2>
          <p className="text-base text-text-secondary mb-8">
            Real UGC from our trained creator network.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {showcaseVideos.map((v) => (
              <div
                key={v.src}
                className="bg-bg-card rounded-2xl overflow-hidden border border-border group"
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
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
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
                <div className="p-3 flex items-center justify-between">
                  <div className="flex gap-3 text-[11px] text-text-dim font-medium">
                    <span>♥ {v.likes}</span>
                    <span>{v.engagement} eng.</span>
                  </div>
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

      {/* HOW IT WORKS */}
      <section className="py-[100px]">
        <div className="max-w-[720px] mx-auto px-6">
          <Label>How it works</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            From signed to viral in 9 days
          </h2>
          <p className="text-base text-text-secondary mb-10">
            A methodology refined across 50+ campaigns. Not a black box.
          </p>

          <div className="flex flex-col gap-5">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-5 items-start">
                <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
                  {s.num}
                </div>
                <div>
                  <h4 className="text-[17px] font-bold tracking-tight mb-1">
                    {s.title}
                  </h4>
                  <p className="text-[15px] text-text-secondary leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="text-xs text-text-dim mt-1 font-medium">
                    {s.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* OUR FORMAT */}
      <section className="py-[100px]">
        <div className="max-w-[720px] mx-auto px-6">
          <Label>Our format</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Talking-head only. No text-on-screen.{" "}
            <span className="text-accent">Ever.</span>
          </h2>
          <p className="text-base text-text-secondary mb-10">
            Every platform&apos;s algorithm rewards authentic human content. A real face converts better than text overlays.
          </p>

          {/* Comparison — row-based table */}
          <div className="mb-8 border-t border-border">
            {/* Header */}
            <div className="grid grid-cols-2 md:grid-cols-[140px_1fr_1fr] gap-4 md:gap-6 py-4 border-b border-border">
              <div className="hidden md:block"></div>
              <div className="text-[11px] text-accent font-semibold uppercase tracking-wider">
                Vo Creations
              </div>
              <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
                Most UGC agencies
              </div>
            </div>
            {[
              ["Format", "Talking-head storytelling", "Text-on-screen, mixed formats"],
              ["Length", "15–40 seconds", "Varies (15s–3min)"],
              ["Why it works", "Authentic. Feels like a friend's recommendation.", "Looks “produced.” Platforms are deprioritizing it."],
              ["Creator skill", "High, from mentorship training", "Low, anyone can overlay text"],
              ["Scroll-stop", "A real face holds attention", "Text competes with every other overlay"],
            ].map(([label, vo, others]) => (
              <div
                key={label}
                className="grid grid-cols-2 md:grid-cols-[140px_1fr_1fr] gap-x-4 md:gap-x-6 gap-y-3 py-5 border-b border-border last:border-b-0"
              >
                <div className="col-span-2 md:col-span-1 text-[11px] text-text-dim uppercase tracking-wide font-semibold">
                  {label}
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-accent leading-snug shrink-0">&#10003;</span>
                  <span className="text-sm text-text leading-snug">{vo}</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-text-dim leading-snug shrink-0">&#10007;</span>
                  <span className="text-sm text-text-dim leading-snug">{others}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            Our creators are trained to tell a compelling story in 30 seconds
            with nothing but their face, their voice, and your product.
            That&apos;s the skill. That&apos;s what you&apos;re paying for.
          </p>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* PRICING */}
      <section className="py-[100px]">
        <div className="max-w-[720px] mx-auto px-6">
          <Label>Pricing</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Simple pricing. <span className="text-accent">No hidden fees.</span>
          </h2>
          <p className="text-base text-text-secondary mb-10">
            All creators are trained through our mentorship. All campaigns
            include the VoC Method. Paid upfront.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starter */}
            <div className="bg-bg-card rounded-2xl border border-border p-7">
              <div className="text-xs text-text-dim font-semibold uppercase tracking-wide mb-1">
                Starter
              </div>
              <div className="text-[40px] font-black text-text tracking-tight leading-none mb-1">
                $10,000
                <span className="text-base font-medium text-text-dim">/mo</span>
              </div>
              <div className="h-px bg-border my-5" />
              <ul className="space-y-3">
                {[
                  "180 unique videos / 720 posts",
                  "3 vetted creators",
                  "TikTok · Instagram · YouTube · Facebook",
                  "30-day campaign",
                  "VoC Method included",
                  "Weekly optimization",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-text-secondary">
                    <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth */}
            <div className="bg-bg-card rounded-2xl border border-accent/30 p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent text-bg text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                Popular
              </div>
              <div className="text-xs text-accent font-semibold uppercase tracking-wide mb-1">
                Growth
              </div>
              <div className="text-[40px] font-black text-text tracking-tight leading-none mb-1">
                $20,000
                <span className="text-base font-medium text-text-dim">/mo</span>
              </div>
              <div className="h-px bg-border my-5" />
              <ul className="space-y-3">
                {[
                  "360 unique videos / 1,440 posts",
                  "6 vetted creators",
                  "TikTok · Instagram · YouTube · Facebook",
                  "30-day campaign",
                  "VoC Method included",
                  "Weekly optimization",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-text-secondary">
                    <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://calendar.app.google/BMAP5qH6Qwtkm5Yr5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Apply for a campaign slot →
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* RESULTS */}
      <section className="py-[100px]" id="results">
        <div className="max-w-[1000px] mx-auto px-6">
          <Label>Results</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Real campaigns. Real numbers.
          </h2>
          <p className="text-base text-text-secondary mb-10">
            Click any card for the full story.
          </p>

          <div className="flex flex-col gap-4">
            <ResultCard
              company="Fable"
              tags={["Social reading app", "Palo Alto", "$28M raised", "Tiger Global, Redpoint"]}
              views="25.4M"
              viewsSub="4 weeks / 3 creators"
              quote="Vo Creations delivered 3M views in just 7 days. Their creators truly understand how to create content that resonates."
              quoteSource="Fable team"
              challenge="Break through in competitive book discovery. Traditional marketing wasn't reaching Gen Z readers where they spend time."
              approach="3 creators, 180 videos, 4 platforms. Applied the VoC Method: 7 format experiments in week 1, tracked performance, cut the bottom 4 formats, tripled down on the winners. One talking-head format hit 3.5M views. Every creator pivoted."
              result="25.4M total views in 30 days. The methodology that now powers every VoC campaign was born here."
              miniStats={[
                { value: "180", label: "Videos" },
                { value: "3", label: "Creators" },
                { value: "25.4M", label: "Total views" },
                { value: "30", label: "Days" },
              ]}
            />

            <ResultCard
              company="Codedex"
              tags={["Learn-to-code platform", "Brooklyn, NY", "$1M raised", "Hustle Fund, Goodwater"]}
              views="10M+"
              viewsSub="2 months"
              quote="We tried influencer marketing before, but Vo Creations gave us 10x the results at a fraction of the cost."
              quoteSource="Codedex team"
              challenge="Reach Gen Z developers. Technical audience, hard to engage with traditional marketing."
              approach="Matched creators who are actual developers from our network. Content that spoke the audience's language authentically."
              result="10M+ views in 2 months. Strong community engagement and meaningful user acquisition."
              miniStats={[
                { value: "10M+", label: "Views" },
                { value: "4", label: "Platforms" },
                { value: "60", label: "Days" },
                { value: "Gen Z", label: "Audience" },
              ]}
            />

            <ResultCard
              company="BlackBox AI"
              tags={["AI Developer Tools", "Coding assistant"]}
              views="11.5M"
              viewsSub="20 days / 40-60 paid-organic mix"
              quote="Vo Creations made our paid ads indistinguishable from organic creator content. That's what scaled us."
              quoteSource="BlackBox AI team"
              challenge="AI coding tools are niche and intimidating for mass short-form audiences. Traditional ads triggered ad blindness."
              approach="UGC-first paid ads designed to look identical to organic creator content. Problem → payoff storytelling: open with relatable pain (debugging frustration, time pressure), show BlackBox AI as the unlock. 420 paid ad variations tested with a 40/60 paid-to-organic content mix."
              result="11.5M organic views in just 20 days. 420 paid ads produced and deployed at scale. Strong engagement from developers, students, and builders asking workflow questions and tagging peers."
              miniStats={[
                { value: "11.5M", label: "Views" },
                { value: "420", label: "Paid ads" },
                { value: "20", label: "Days" },
                { value: "40/60", label: "Paid/organic" },
              ]}
            />

            <ResultCard
              company="Makon AI"
              tags={["EdTech", "SAT prep", "AI-powered"]}
              views="10.2M"
              viewsSub="2 months / 8 creators"
              quote="Vo Creations turned SAT prep, one of the hardest categories to make viral, into bingeable short-form content."
              quoteSource="Makon AI team"
              challenge="SAT prep is perceived as boring and transactional. Most competitors relied on dense demos and jargon that students scrolled past."
              approach="Creator-led talking-head videos that felt personal and raw. Students speaking to students. Story-first, product-second: open with emotional tension (stress, burnout, parental pressure), then naturally introduce Makon AI as the turning point."
              result="10.2M organic views in 2 months. Comment sections filled with students asking questions, sharing stress, and tagging friends. Makon positioned as a modern, student-first SAT solution."
              miniStats={[
                { value: "10.2M", label: "Views" },
                { value: "8", label: "Creators" },
                { value: "60", label: "Days" },
                { value: "Gen Z", label: "Audience" },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* WHAT TO EXPECT */}
      <section className="py-[100px]">
        <div className="max-w-[720px] mx-auto px-6">
          <Label>What to expect</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-6">
            1 million organic views.{" "}
            <span className="text-accent">Guaranteed.</span>
          </h2>

          <div className="space-y-5 text-[15px] text-text-secondary leading-relaxed">
            <p>
              Baseline: 1M+ organic views in the first month across 4 platforms. Most campaigns land 3–10M. Some go higher when a format breaks through.
            </p>
          </div>

          <div className="mt-8 bg-bg-card rounded-2xl border border-accent/30 p-6">
            <div className="text-xs text-accent font-semibold uppercase tracking-wide mb-2">
              View guarantee
            </div>
            <p className="text-base text-text font-semibold">
              1,000,000 organic views, or 50% refund.
            </p>
          </div>

        </div>
      </section>

      {/*
        VoC METHOD SECTION — removed from display for now. Content preserved:
        - Week 1: Format experiments (one new format per creator per day, 7 tested in 7 days)
        - End of Week 1: Cut bottom performers (4 lowest replaced with new ones)
        - Week 2: Refine survivors (double down on traction, iterate hooks/pacing/CTAs)
        - Viral trigger: Triple down (when a video goes viral, every creator pivots)
        - Constraint: Talking-head storytelling only (15-40s, never text-on-screen)
      */}


      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* PARTNERSHIPS */}
      <section className="py-[100px]">
        <div className="max-w-[1000px] mx-auto px-6">
          <Label>Partnerships</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Who we partner with
          </h2>
          <p className="text-base text-text-secondary mb-10">
            Tools and platforms we work alongside to deliver campaigns at scale.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "SideShift",
                desc: "UGC operating system we use to recruit creators, run campaigns, track results, and automate payouts.",
                href: "https://sideshift.app/",
              },
              {
                name: "Content Rewards",
                desc: "Performance-based creator network that pays out on video results, helping us scale top formats faster.",
                href: "https://contentrewards.com/",
              },
              {
                name: "Museon",
                desc: "AI tool that surfaces trending content and generates variations, accelerating our VoC format testing.",
                href: "https://museon.ai/",
              },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-bg-card rounded-2xl border border-border p-6 hover:border-accent/40 transition-all"
              >
                <div className="text-[17px] font-bold tracking-tight mb-2 group-hover:text-accent transition-colors">
                  {p.name}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {p.desc}
                </p>
                <span className="text-[13px] text-accent font-medium">
                  Visit site &#8599;
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[100px]">
        <div className="max-w-[720px] mx-auto px-6">
          <Label>FAQ</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-10">
            Common questions
          </h2>

          <div className="max-w-[640px]">
            {agencyFaqs.map((faq, i) => (
              <div key={i} className="border-b border-border py-[22px]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <span className="text-base font-semibold tracking-tight">
                    {faq.q}
                  </span>
                  <span
                    className={`text-[22px] text-accent font-light shrink-0 ml-4 transition-transform ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="mt-3 text-[15px] text-text-secondary leading-[1.7] pr-10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <CTABlock />

      <Footer />
    </>
  );
}
