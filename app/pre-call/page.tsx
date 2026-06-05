"use client";

import { useState, useEffect, useRef } from "react";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function ScaleIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function FAQItem({ question, answer, hasVideo = false, wistiaId }: { question: string; answer: string; hasVideo?: boolean; wistiaId?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <div className="flex items-center gap-3 pr-4">
          {hasVideo && (
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 12px rgba(147, 184, 255, 0.4), 0 0 30px rgba(147, 184, 255, 0.25), 0 0 50px rgba(147, 184, 255, 0.1)" }}>
              <PlayIcon className="w-3 h-3 text-white ml-[1px]" />
            </div>
          )}
          <span className="text-[15px] sm:text-[16px] font-medium text-[#0A0A0A]">{question}</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-[#9CA3AF] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{ maxHeight: open ? "800px" : "0", opacity: open ? 1 : 0 }}
      >
        <div className="pb-6">
          {hasVideo && wistiaId && (
            <div className="rounded-xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(147, 184, 255, 0.12), 0 1px 4px rgba(0,0,0,0.06)" }}>
              {/* @ts-expect-error wistia-player is a custom element */}
              <wistia-player media-id={wistiaId} aspect="1.7777777777777777"></wistia-player>
            </div>
          )}
          <p className="text-[14px] sm:text-[15px] text-[#6B7280] leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

const videoFaqs: { title: string; wistiaId?: string }[] = [
  { title: "What Is The Success Rate Inside The Program?", wistiaId: "aczfcyfhlx" },
  { title: "How Long Until I See Any Results?", wistiaId: "h6jhardfjq" },
  { title: "What Makes Vo Creations Different Than Other Mentorships?", wistiaId: "4qi0dlx7yy" },
  { title: "How Is This Different Than Watching Free Resources?", wistiaId: "u704r85utq" },
  { title: "Can I Do This Still Working A Full-Time Job Or In College?", wistiaId: "qh4i625bbi" },
];

const bottomFaqs = [
  { question: "What is the success rate in the program?", answer: "Our success rate is extremely high because we don't leave anything to chance. You get placed on real deals through our agency, coached 1-on-1, and supported every step of the way." },
  { question: "How much money do I need to start?", answer: "You'll need capital for inventory (we recommend starting with at least $2k-5k) plus the mentorship investment. I'll show you how to maximize every dollar and many students use credit strategically. On our call, we'll go over your specific financial situation." },
  { question: "What's the investment for the mentorship?", answer: "We'll go over pricing and payment options on your call. The investment depends on which tier of mentorship makes the most sense for your situation." },
  { question: "I have a full-time job. Can I still do this?", answer: "Absolutely. Most of our successful students started while working full-time. Even 5-10 hours per week is enough to get started and see results." },
  { question: "How quickly will I see results?", answer: "Most students land their first paid deal within 7 days of starting. From there, it's about stacking and scaling." },
  { question: "How is this different from other courses?", answer: "This isn't a course, it's a mentorship. You get 1-on-1 guidance, guaranteed placements, and ongoing support. You're not left figuring things out alone." },
  { question: "What if I've tried before and failed?", answer: "That actually puts you ahead. You already know what doesn't work. The mentorship gives you a proven system and someone in your corner to make sure you succeed this time." },
  { question: "Why should I trust you?", answer: "Check the results section. Real screenshots, real students, real revenue. We also have a full video case study documenting the process from start to finish." },
];

const phases = [
  {
    number: "01",
    period: "Month 1",
    title: "Onboarding & First Paid Deal",
    description: "You're not watching modules alone hoping something clicks. You're getting placed on a real deal immediately.",
    bullets: [
      "1-on-1 onboarding call with me, we map out your strategy and lock in your niche for digital brands",
      "Content workshopped and brand-ready within your first week (even if you've never made a video before)",
      "All six training modules, templates, scripts, and frameworks unlocked + 4 coaching calls every week from day one",
    ],
  },
  {
    number: "02",
    period: "Month 2",
    title: "Deal Stacking to $3K to $5K/mo",
    description: "Your first deal is running. Your content is dialed. Now we stack you up to $3K to $5K/month.",
    bullets: [
      "Second and third deals opened, you're building a portfolio entirely from paid work, not free samples",
      "Unlimited agency deal access activated at $30/video minimum + performance bonuses",
      "Portfolio reviews, video breakdowns, and weekly 1-on-1s with me to sharpen everything so brands renew and increase your rates",
      "This is where most students stack to $3K to $5K/month consistently by locking in multiple retainers",
    ],
  },
  {
    number: "03",
    period: "Month 3",
    title: "Accelerate to $10K+/mo",
    description: "This is where you break through. We accelerate your income past $10K+/month and build a system that runs with or without the agency.",
    bullets: [
      "Students accelerate to $10K+/month by stacking high-ticket retainers, the same path Jomar (19, under 200 followers) used to hit $14K his first month",
      "Independent outreach system built, 1,000+ brand contacts, proven templates, and the confidence to land deals on your own",
      "Real portfolio from real paid work, a proven system you can run forever, and the skills to keep scaling well beyond $10K+/month",
    ],
  },
  {
    number: "04",
    period: "Month 4",
    title: "Full Scale, Your Business Runs Itself",
    description: "Month 4 is your scaling month. By now you have the deals, the system, and the skills. This is where we remove the ceiling entirely.",
    bullets: [
      "Audit everything, rates, retainers, content volume, and identify exactly where to double your income without doubling your workload",
      "Build your personal brand flywheel so inbound deals start coming to you instead of you chasing them",
      "Systematize your UGC operation so it runs like a business, repeatable, scalable, and sustainable past the mentorship",
      "Most students finish Month 4 with $10K to $15K/month locked in and a clear path to grow beyond it on their own",
    ],
  },
];

export default function PreCall() {
  useEffect(() => {
    const wistiaPlayer = document.createElement("script");
    wistiaPlayer.src = "https://fast.wistia.com/player.js";
    wistiaPlayer.async = true;
    document.body.appendChild(wistiaPlayer);

    const embedIds = ["kqwkteyp0m", "g2f6wiqw6c", "aczfcyfhlx", "4qi0dlx7yy", "h6jhardfjq", "qh4i625bbi", "u704r85utq"];
    const embedScripts = embedIds.map((id) => {
      const s = document.createElement("script");
      s.src = `https://fast.wistia.com/embed/${id}.js`;
      s.async = true;
      s.type = "module";
      document.body.appendChild(s);
      return s;
    });

    return () => {
      if (wistiaPlayer.parentNode) document.body.removeChild(wistiaPlayer);
      embedScripts.forEach((s) => { if (s.parentNode) document.body.removeChild(s); });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] overflow-x-hidden overflow-y-auto" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Hero - Thank You + Video */}
      <section className="pt-16 pb-10 md:pt-32 md:pb-20 px-5 sm:px-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 184, 255, 0.3) 0%, rgba(170, 200, 255, 0.15) 35%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute top-20 -left-20 w-[400px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 197, 253, 0.15) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-32 -right-20 w-[350px] h-[350px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(165, 200, 255, 0.12) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div className="max-w-[680px] mx-auto relative z-10">

          <FadeUp>
            <header className="mb-10 md:mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
                Your application has been received
              </p>
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-3">Step 1 of 7</p>
              <h1 className="font-bold leading-[1.12] tracking-[-0.02em] text-[#0A0A0A] mb-5 text-[28px] sm:text-[36px] md:text-[44px]" style={{ textShadow: "0 0 40px rgba(147, 184, 255, 0.15)" }}>
                Watch This Before Your Call
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-[#6B7280]">
                This video covers everything you need to know. Watch it fully so when we connect, we can skip the basics and focus on your specific situation.
              </p>
            </header>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="mb-16 md:mb-20 relative">
              <div
                className="absolute -inset-8 md:-inset-14 rounded-3xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(130, 170, 255, 0.3) 0%, rgba(160, 195, 255, 0.18) 30%, rgba(190, 215, 255, 0.08) 55%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 10px 30px 0px, rgba(0, 0, 0, 0.25) 0px 4px 10px 0px, 0 0 40px rgba(147, 184, 255, 0.12)" }}
              >
                {/* @ts-expect-error wistia-player is a custom element */}
                <wistia-player media-id="kqwkteyp0m" aspect="1.7777777777777777"></wistia-player>
              </div>
            </div>
          </FadeUp>

          {/* What's Next */}
          <FadeUp delay={0.2}>
            <section className="mb-16 md:mb-20">
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-8" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>What&apos;s Next</h2>

              <div className="space-y-6">
                {[
                  { num: "01", title: "Check Your Email", desc: "You should have received a confirmation email. The emails we send before your call are very important, make sure you read through them so you're fully prepared." },
                  { num: "02", title: "Watch the Video Above & Browse FAQs Below", desc: "Come to the call prepared. The more you know, the more we can focus on your specific situation." },
                  { num: "03", title: "Remember Why You Applied", desc: "You didn't apply because everything is working. Hold onto that reason, this call could be the turning point that changes everything." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-[10px] font-semibold text-white mt-0.5"
                      style={{ boxShadow: "0 0 12px rgba(147, 184, 255, 0.4), 0 0 30px rgba(147, 184, 255, 0.25), 0 0 50px rgba(147, 184, 255, 0.1)" }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-[#0A0A0A] mb-1">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-[#6B7280]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </FadeUp>

          {/* Offer Breakdown Video */}
          <FadeUp delay={0.1}>
            <section className="mb-16 md:mb-20 text-center">
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2">Step 2 of 7</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Offer Breakdown</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-3" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>What You&apos;re Getting</h2>
              <p className="text-base leading-relaxed text-[#6B7280] mb-6">
                Watch this quick breakdown of exactly what&apos;s included in the mentorship and how it works.
              </p>
              <div className="relative">
                <div
                  className="absolute -inset-6 md:-inset-10 rounded-3xl pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(130, 170, 255, 0.2) 0%, rgba(160, 195, 255, 0.1) 35%, transparent 65%)",
                    filter: "blur(10px)",
                  }}
                />
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 10px 30px 0px, rgba(0, 0, 0, 0.25) 0px 4px 10px 0px, 0 0 40px rgba(147, 184, 255, 0.12)" }}
                >
                  {/* @ts-expect-error wistia-player is a custom element */}
                  <wistia-player media-id="g2f6wiqw6c" aspect="1.7777777777777777"></wistia-player>
                </div>
              </div>
            </section>
          </FadeUp>

          {/* Video FAQ Section */}
          <FadeUp>
            <section className="mb-16 md:mb-20">
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2 text-center">Step 3 of 7</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-2 text-center" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>Frequently Asked Questions</h2>
              <p className="text-sm text-[#6B7280] mb-8 text-center">Watch our most frequently asked questions.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {videoFaqs.map((faq, i) => (
                  <FadeUp key={i} delay={i * 0.05}>
                    <div>
                      {faq.wistiaId ? (
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{ boxShadow: "0 4px 20px rgba(147, 184, 255, 0.12), 0 1px 4px rgba(0,0,0,0.06)" }}
                        >
                          {/* @ts-expect-error wistia-player is a custom element */}
                          <wistia-player media-id={faq.wistiaId} aspect="1.7777777777777777"></wistia-player>
                        </div>
                      ) : (
                        <div
                          className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer group"
                          style={{ boxShadow: "0 4px 20px rgba(147, 184, 255, 0.12), 0 1px 4px rgba(0,0,0,0.06)" }}
                        >
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#111]">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent" />
                            <div className="relative w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                              <PlayIcon className="w-5 h-5 text-[#0A0A0A] ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-[14px] sm:text-[15px] font-medium text-[#0A0A0A] mt-3 text-center">{faq.title}</p>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </section>
          </FadeUp>

          {/* Case Study */}
          <FadeUp>
            <section className="mb-16 md:mb-20">
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2 text-center">Step 4 of 7</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-2 text-center" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>Real Student Interviews</h2>
              <p className="text-sm text-[#6B7280] mb-8 text-center">Hear directly from students inside the program about their experience and results.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Sahmie", subtitle: "$12K in 3 months", youtubeId: "ShGwL6e_L1g" },
                  { title: "Casey, 22", subtitle: "$6,900 in 2 months", youtubeId: "tTFSuQVUbOQ" },
                  { title: "Charles", subtitle: "$10K to $12K in his first month", youtubeId: "2NuhWneaEVA" },
                  { title: "Jomar, 19", subtitle: "$2K to $14K/mo in 2 months", youtubeId: "PPh7ZfyEOXc" },
                  { title: "Akira, 17", subtitle: "$11K in just 30 days", youtubeId: "wk1CNywWIr0" },
                ].map((item, i) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div>
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden"
                        style={{ boxShadow: "0 4px 20px rgba(147, 184, 255, 0.12), 0 1px 4px rgba(0,0,0,0.06)" }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${item.youtubeId}`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={item.title}
                        />
                      </div>
                      <p className="text-[14px] sm:text-[15px] font-medium text-[#0A0A0A] mt-3 text-center">{item.title}</p>
                      <p className="text-[12px] sm:text-[13px] text-[#6B7280] text-center">{item.subtitle}</p>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </section>
          </FadeUp>

          {/* Roadmap - 120 Day Operating System */}
          <FadeUp>
            <section className="mb-16 md:mb-20">
              <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2 text-center">Step 5 of 7</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2 text-center">The complete roadmap</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-3 text-center" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>The 120-Day Operating System</h2>
              <p className="text-base leading-relaxed text-[#6B7280] mb-12 text-center">
                Four months from setup to full scale, with hands-on support at every step.
              </p>

              <div className="space-y-14">
                {phases.map((phase, index) => (
                  <FadeUp key={index} delay={index * 0.08}>
                    <div className="relative">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-[10px] font-semibold text-white mt-0.5"
                          style={{ boxShadow: "0 0 12px rgba(147, 184, 255, 0.4), 0 0 30px rgba(147, 184, 255, 0.25), 0 0 50px rgba(147, 184, 255, 0.1)" }}
                        >
                          {phase.number}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">{phase.period}</p>
                          <h3 className="text-lg font-semibold tracking-tight text-[#0A0A0A]">{phase.title}</h3>
                        </div>
                      </div>
                      <div className="ml-11">
                        <p className="text-sm leading-relaxed text-[#6B7280] mb-4">{phase.description}</p>
                        <div className="space-y-2.5">
                          {phase.bullets.map((bullet, bi) => (
                            <div key={bi} className="flex items-start gap-2.5">
                              <div className="w-4 h-4 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckIcon className="w-2.5 h-2.5 text-[#6B7280]" />
                              </div>
                              <span className="text-sm text-[#374151] leading-relaxed">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {index < phases.length - 1 && (
                        <div className="mt-14 border-t border-[#F3F4F6]" />
                      )}
                    </div>
                  </FadeUp>
                ))}
              </div>
            </section>
          </FadeUp>


        </div>
      </section>
      {/* Results Section - Full Width */}
      <section className="py-16 px-5 sm:px-6 relative">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 184, 255, 0.1) 0%, transparent 60%)",
            filter: "blur(50px)",
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <FadeUp>
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2 text-center">Step 6 of 7</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2 text-center">Results</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-3 text-center" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>Real People, Real Results</h2>
            <p className="text-base text-[#6B7280] mb-12 text-center">More testimonials & proof from students inside of the same program you&apos;ll get access to.</p>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {["1kzbvv3bt3", "9c32m2qg0e", "2pw2ns6e1o", "em4nwvocos", "hiw8ng0g0a", "wjbojdmv02"].map((id, i) => (
              <ScaleIn key={id} delay={i * 0.06}>
                <div
                  className="rounded-xl overflow-hidden relative"
                  style={{ boxShadow: "0 4px 20px rgba(147, 184, 255, 0.12), 0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {/* @ts-expect-error wistia-player is a custom element */}
                  <wistia-player media-id={id} aspect="0.5625"></wistia-player>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>
      {/* Bottom FAQ Section */}
      <section className="py-16 px-5 sm:px-6 relative">
        <div className="max-w-[680px] mx-auto relative z-10">
          <FadeUp>
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#93B8FF] mb-2">Step 7 of 7</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-[#0A0A0A] mb-8" style={{ textShadow: "0 0 30px rgba(147, 184, 255, 0.12)" }}>Frequently Asked Questions</h2>
            <div className="border-t border-[#E5E7EB]">
              {bottomFaqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
