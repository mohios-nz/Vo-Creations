import Link from "next/link";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import WistiaEmbed from "@/components/WistiaEmbed";

const tickerItems = [
  { views: "24M views", desc: "VoC Method campaign, 30 days" },
  { views: "3.5M views", desc: "Lore, 2 viral hits" },
  { views: "1.1M+ views", desc: "UNBRKN campaign" },
  { views: "100M+ views", desc: "Daniel, started at 17" },
  { views: "YouTube breakout", desc: "BotChat, Tammy" },
  { views: "347K views", desc: "Counter AI" },
];

const stats = [
  { num: "$10B+", text: "US brands spent on creator content in 2025", source: "↑ 11% YoY" },
  { num: "93%", text: "Marketers say UGC outperforms traditional ads", source: "Brand adoption" },
  { num: "6.9×", text: "More engagement than brand-created content", source: "vs branded" },
];

const systemCards = [
  { num: "01", title: "Test formats fast", desc: "One new format per day for 7 days. Ship and learn what the algorithm rewards." },
  { num: "02", title: "Cut what doesn't work", desc: "After Week 1, bottom performers get replaced. You only keep winners." },
  { num: "03", title: "Double down", desc: "Week 2 refines survivors. When something goes viral, every creator triples down." },
  { num: "04", title: "Talking-head only", desc: "15-40 seconds. Real face. Real voice. No text-on-screen. That's what brands pay for." },
];

const creatorVideos = [
  { videoId: "1kzbvv3bt3", thumbnail: "https://embed-ssl.wistia.com/deliveries/d1c4ba8dbe8f5c5b035057b26a3791f8f94031d4.jpg" },
  { videoId: "9c32m2qg0e", thumbnail: "https://embed-ssl.wistia.com/deliveries/ce2d6ecebe88aee5c261024a00d1ef66876cfdc8.jpg" },
  { videoId: "2pw2ns6e1o", thumbnail: "https://embed-ssl.wistia.com/deliveries/8e42803b64fe02497c1dd59e4b7d9c5a8a9cb4e7.jpg" },
  { videoId: "em4nwvocos", thumbnail: "https://embed-ssl.wistia.com/deliveries/b0d39bafec93e5dde4aa2f034acd63d83a00103a.jpg" },
  { videoId: "hiw8ng0g0a", thumbnail: "https://embed-ssl.wistia.com/deliveries/ddf75779769cd83d85d06c3992b87f87f85a44b5.jpg" },
  { videoId: "wjbojdmv02", thumbnail: "https://embed-ssl.wistia.com/deliveries/a4f6efc07fd490e50156503a355a7d87e9453941.jpg" },
];

/* Pricing & FAQ content saved to /content/mentorship-pricing-faq-backup.md */

function MLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[11px] font-semibold tracking-[2.5px] uppercase text-[#16a34a] mb-4">
      {children}
    </span>
  );
}

export default function MentorshipPage() {
  return (
    <div className="bg-[#fafafa] text-[#1a1a1a] min-h-screen font-space">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-[20px] border-b border-black/[0.06]">
        <Link href="/" className="font-extrabold text-lg tracking-tight text-[#1a1a1a]">
          Vo <span className="text-[#16a34a]">Creators</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/about"
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg text-[#666] hover:text-[#1a1a1a] transition-colors"
          >
            For Brands
          </Link>
          <Link
            href="/mentorship"
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg text-[#1a1a1a] transition-colors"
          >
            For Creators
          </Link>
        </div>

        <a
          href="https://calendly.com/vocreations/vo-creations-mentorship-discovery-call"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex bg-[#16a34a] text-white font-semibold text-[13px] px-6 py-2.5 rounded-full hover:shadow-[0_0_24px_rgba(22,163,74,0.3)] hover:-translate-y-px transition-all tracking-wide"
        >
          Book a call
        </a>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-[140px] pb-20 relative overflow-hidden">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(22,163,74,0.06)_0%,transparent_60%)] pointer-events-none" />

        <h1 className="text-[clamp(40px,7vw,76px)] font-black leading-[1.0] tracking-[-3px] mb-7 animate-fade-up-delay-1">
          Get paid to create
          <br />
          content for{" "}
          <span className="bg-gradient-to-r from-[#16a34a] to-[#0ea5e9] bg-clip-text text-transparent">
            real brands.
          </span>
        </h1>

        <p className="text-[clamp(17px,2.2vw,21px)] text-[#555] max-w-[500px] leading-relaxed mb-8 animate-fade-up-delay-2">
          No followers. No experience. Just your phone and 2 months.
          Your first paid brand campaign is included.
        </p>

        {/* Thienvu video in hero — trust builder */}
        <div className="w-full max-w-[560px] mb-8 animate-fade-up-delay-2">
          <WistiaEmbed
            videoId="g9tkercx5z"
            thumbnailUrl="https://embed-ssl.wistia.com/deliveries/c8ef8017c41758aac74a5ab856fb72c0.jpg"
            title="Meet the creators"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up-delay-3">
          <a
            href="https://calendly.com/vocreations/vo-creations-mentorship-discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(22,163,74,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Book a call &rarr;
          </a>
          <a
            href="#results"
            className="inline-flex items-center gap-2 bg-transparent text-[#1a1a1a] font-medium text-base px-9 py-4 rounded-full border border-black/[0.12] hover:border-black/25 hover:bg-black/[0.03] transition-all"
          >
            See results &rarr;
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-14 mt-[60px] animate-fade-up-delay-4">
          {[
            ["100M+", "Views generated"],
            ["90+", "Creators trained"],
            ["30+", "Brand campaigns"],
          ].map(([num, lbl]) => (
            <div key={lbl} className="text-center">
              <div className="text-[32px] font-extrabold tracking-tighter leading-none text-[#1a1a1a]">
                {num}
              </div>
              <div className="font-mono text-[11px] font-medium text-[#999] tracking-wide uppercase mt-2">
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF TICKER */}
      <div className="border-t border-b border-black/[0.06] py-[18px] overflow-hidden whitespace-nowrap bg-white">
        <div className="inline-flex gap-12 animate-scroll">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div
              key={i}
              className="font-mono text-xs font-semibold text-[#999] flex items-center gap-2.5 shrink-0 tracking-wide"
            >
              <span className="text-[#16a34a] text-[13px]">{item.views}</span>
              {item.desc}
            </div>
          ))}
        </div>
      </div>

      {/* THE REALITY */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <MLabel>This is real</MLabel>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-tighter leading-tight mb-3">
            Brands need creators.
            <br />
            There aren&apos;t enough good ones.
          </h2>
          <p className="text-[17px] text-[#555] max-w-[520px] leading-relaxed">
            UGC, short videos with real faces and voices, is how brands sell now. Not influencers. Not actors. Regular people who tell a story in 30 seconds.
          </p>
        </div>
        <div className="max-w-[1000px] mx-auto mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.num}
                className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center hover:border-[rgba(22,163,74,0.2)] transition-colors shadow-sm"
              >
                <div className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-[#16a34a] to-[#0ea5e9] bg-clip-text text-transparent">
                  {s.num}
                </div>
                <div className="text-sm text-[#555] mt-2.5 leading-snug">
                  {s.text}
                </div>
                <div className="font-mono text-[10px] font-semibold text-[#999] tracking-wide uppercase mt-3">
                  {s.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section
        className="py-[100px] px-6"
        id="results"
      >
        <div className="max-w-[1000px] mx-auto">
          <MLabel>Results</MLabel>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-tighter leading-tight mb-12">
            People who started
            <br />
            exactly where you are.
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {creatorVideos.map((v) => (
              <WistiaEmbed
                key={v.videoId}
                videoId={v.videoId}
                thumbnailUrl={v.thumbnail}
                aspect="portrait"
              />
            ))}
          </div>
        </div>
      </section>

      {/* YOUR COACH — with YouTube video */}
      <section className="py-16 px-6">
        <div className="max-w-[720px] mx-auto">
          <MLabel>Your coach</MLabel>
          <div className="bg-white border border-black/[0.06] rounded-[20px] p-9 mt-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-7 items-center">
              <img
                src="/videos/team-thienvu.jpg"
                alt="Thienvu Vo"
                className="w-[120px] h-[120px] rounded-2xl object-cover border border-[rgba(22,163,74,0.15)] mx-auto md:mx-0"
              />
              <div className="text-center md:text-left">
                <h4 className="text-[22px] font-bold tracking-tight mb-1">
                  Thienvu Vo
                </h4>
                <div className="font-mono text-[11px] font-semibold tracking-[2px] uppercase text-[#16a34a] mb-3">
                  Founder, Vo Creations
                </div>
                <p className="text-[15px] text-[#555] leading-relaxed">
                  Started creating at 18 with zero followers. Built a network of 90+ trained creators generating over 10M views. He teaches the exact system he uses, not theory.
                </p>
                <div className="flex gap-6 mt-4 justify-center md:justify-start">
                  {[
                    ["100M+", "views"],
                    ["90+", "trained"],
                    ["30+", "campaigns"],
                  ].map(([val, label]) => (
                    <span
                      key={label}
                      className="font-mono text-xs text-[#999] font-medium"
                    >
                      <strong className="text-[#1a1a1a] font-bold">{val}</strong>{" "}
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Thienvu's story video */}
            <div className="mt-8">
              <YouTubeEmbed
                videoId="xL3zWBso9mw"
                title="Thienvu: How I built Vo Creations"
              />
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY / COHORT */}
      <section className="py-16 px-6 bg-white border-t border-b border-black/[0.06]">
        <div className="max-w-[720px] mx-auto text-center">
          <MLabel>The community</MLabel>
          <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-tighter leading-tight mb-4">
            You&apos;re not doing this alone.
          </h2>
          <p className="text-[17px] text-[#555] max-w-[500px] mx-auto leading-relaxed mb-10">
            The community is what creators value most. Not just the content, the people going through it with you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Cohort of 10", desc: "Small groups. You know everyone by name." },
              { title: "Accountability from day one", desc: "Weekly calls, daily check-ins, real feedback." },
              { title: "People like you", desc: "Learn alongside creators at exactly your stage." },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-7 text-left"
              >
                <h4 className="text-[17px] font-bold tracking-tight mb-2">
                  {c.title}
                </h4>
                <p className="text-sm text-[#555] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE SYSTEM (VoC Method) */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto text-center mb-12">
          <MLabel>The VoC Method</MLabel>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-tighter leading-tight mb-4">
            A system.{" "}
            <span className="text-[#16a34a]">24M views.</span>
            <br />
            30 days.
          </h2>
          <p className="text-[17px] text-[#555] max-w-[520px] mx-auto leading-relaxed">
            Most programs give you lessons and wish you luck. This one uses the exact methodology behind our biggest campaigns.
          </p>
        </div>

        <div className="max-w-[680px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemCards.map((c) => (
            <div
              key={c.num}
              className="bg-white border border-black/[0.06] rounded-2xl p-7 hover:border-[rgba(22,163,74,0.2)] hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <div className="font-mono text-[11px] font-bold text-[#16a34a] tracking-wide mb-3">
                {c.num}
              </div>
              <h4 className="text-[17px] font-bold tracking-tight mb-2">
                {c.title}
              </h4>
              <p className="text-sm text-[#555] leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Case study video */}
        <div className="max-w-[560px] mx-auto mt-12">
          <YouTubeEmbed
            videoId="tTFSuQVUbOQ"
            title="VoC Method in action"
          />
        </div>
      </section>

      {/* THE PROGRAM */}
      <section className="py-[100px] px-6 bg-white border-t border-b border-black/[0.06]">
        <div className="max-w-[720px] mx-auto">
          <MLabel>The program</MLabel>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-tighter leading-tight mb-3">
            From zero to paid creator.
            <br />
            In 120 days.
          </h2>
          <p className="text-[17px] text-[#555] max-w-[520px] leading-relaxed mb-12">
            Four months from setup to full scale, with hands-on support at every step.
          </p>

          {/* Timeline */}
          <div className="relative max-w-[600px] mx-auto">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#16a34a] to-[rgba(22,163,74,0.1)] rounded-full" />

            {[
              {
                label: "Month 1",
                title: "Onboarding & first paid deal",
                desc: "1-on-1 onboarding call, niche locked in, content workshopped and brand-ready in your first week. All six modules, templates, and 4 coaching calls every week from day one.",
                future: false,
              },
              {
                label: "Month 2",
                title: "Deal stacking to $3K to $5K/mo",
                desc: "Second and third deals opened. Unlimited agency access at $30/video minimum plus performance bonuses. Weekly 1-on-1s and portfolio reviews so brands renew and rates climb.",
                earn: true,
                future: false,
              },
              {
                label: "Month 3",
                title: "Accelerate to $10K+/mo",
                desc: "Stack high-ticket retainers and break through. Independent outreach system built with 1,000+ brand contacts, proven templates, and the confidence to land deals on your own.",
                future: true,
              },
              {
                label: "Month 4",
                title: "Full scale, your business runs itself",
                desc: "Audit rates, retainers, and content volume. Build your personal brand flywheel for inbound deals. Most students finish with $10K to $15K/month locked in and a clear path to grow.",
                future: true,
              },
            ].map((item, i) => (
              <div key={i} className="relative pl-[60px] pb-12 last:pb-0">
                <div
                  className={`absolute left-[10px] top-1.5 w-5 h-5 rounded-full border-[3px] ${
                    item.future
                      ? "bg-[#fafafa] border-[#16a34a]"
                      : "bg-[#16a34a] border-white shadow-[0_0_12px_rgba(22,163,74,0.3)]"
                  }`}
                />
                <div className="font-mono text-[11px] font-bold tracking-[2px] uppercase text-[#16a34a] mb-2">
                  {item.label}
                </div>
                <h4 className="text-[21px] font-bold tracking-tight mb-2">
                  {item.title}
                </h4>
                <p className="text-[15px] text-[#555] leading-relaxed">
                  {item.desc}
                </p>
                {"earn" in item && item.earn && (
                  <div className="inline-flex items-center gap-1.5 bg-[rgba(22,163,74,0.08)] border border-[rgba(22,163,74,0.2)] rounded-full px-[18px] py-2 font-mono text-[13px] font-semibold text-[#16a34a] mt-3.5">
                    ✓ Stack to $3K to $5K/mo
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Program video */}
          <div className="max-w-[560px] mx-auto mt-12">
            <YouTubeEmbed
              videoId="2NuhWneaEVA"
              title="Inside the program"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center mt-12">
            {[
              "Work from anywhere",
              "No followers needed",
              "~10h/week during training",
              "Any recent smartphone",
            ].map((tag) => (
              <span
                key={tag}
                className="bg-[#fafafa] border border-black/[0.06] rounded-full px-[22px] py-2.5 text-sm font-medium text-[#555] hover:border-[rgba(22,163,74,0.2)] transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="text-center py-[120px] px-6 relative overflow-hidden bg-white" id="apply">
        <h2 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] mb-4 leading-tight">
          Ready to find out?
        </h2>
        <p className="text-[17px] text-[#555] mb-9">
          A real skill, a real campaign, and a real network.
        </p>
        <a
          href="https://calendly.com/vocreations/vo-creations-mentorship-discovery-call"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(22,163,74,0.3)] hover:-translate-y-0.5 transition-all"
        >
          Book a call &rarr;
        </a>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 border-t border-black/[0.06]">
        <p className="font-mono text-xs text-[#999] font-medium">
          © 2026 Vo Creations ·{" "}
          <a
            href="https://vocreations.com"
            className="text-[#999] underline underline-offset-[3px] decoration-black/15"
          >
            vocreations.com
          </a>
        </p>
      </footer>
    </div>
  );
}
