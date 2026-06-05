"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CTABlock from "@/components/CTABlock";
import Label from "@/components/Label";
import Link from "next/link";

const creators = [
  { name: "Daniel Yun", months: "24 months", views: "100M+", platforms: "TikTok · IG · YT · FB", duration: "0:38", initials: "DY" },
  { name: "Beo K.", months: "12 months", views: "12M+", platforms: "TikTok · IG · YT", duration: "0:42", initials: "BK" },
  { name: "Mae E.", months: "8 months", views: "8M+", platforms: "TikTok · IG · FB", duration: "0:35", initials: "ME" },
  { name: "Tammy L.", months: "8 months", views: "5M+", platforms: "YouTube · TikTok", duration: "2:42", initials: "TL" },
  { name: "Zane R.", months: "6 months", views: "4M+", platforms: "TikTok · IG", duration: "0:29", initials: "ZR" },
  { name: "Chad H.", months: "10 months", views: "3M+", platforms: "TikTok · IG · YT", duration: "0:46", initials: "CH" },
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

export default function CreatorsPage() {
  const [budget, setBudget] = useState(15000);
  const [videos, setVideos] = useState(180);

  const influencerCost = videos * 500;
  const vocCostPerVideo = budget / videos;
  const savings = influencerCost - budget;
  const savingsPercent = Math.round((savings / influencerCost) * 100);

  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="pt-[160px] pb-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <Label>Our network</Label>
          <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] tracking-tighter mb-6">
            100+ trained creators.{" "}
            <span className="text-accent">500M+ views</span> and counting.
          </h1>
          <p className="text-[clamp(16px,2vw,19px)] text-text-secondary max-w-[520px] mx-auto leading-relaxed">
            Every creator trained through our mentorship. No freelancers. No marketplace.
          </p>
        </div>
      </section>

      {/* CREATOR GRID */}
      <section className="pb-[100px]">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {creators.map((c) => (
              <div
                key={c.name}
                className="bg-bg-card rounded-2xl aspect-[9/14] relative overflow-hidden border border-border flex items-center justify-center"
              >
                {/* Placeholder avatar */}
                <div className="text-4xl font-black text-accent/20">
                  {c.initials}
                </div>

                {/* Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-black/85 to-transparent">
                  <div className="text-sm font-bold">{c.name}, <span className="text-accent font-semibold">{c.months}</span></div>
                  <div className="text-xs text-accent mt-0.5 font-semibold">
                    {c.views} views
                  </div>
                  <div className="text-[11px] text-text-dim mt-0.5">
                    {c.platforms}
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-3.5 right-3.5 text-[11px] text-text bg-black/60 px-2 py-0.5 rounded">
                  {c.duration}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-text-dim mt-8 font-medium">
            Showing 6 of 100+ creators.
          </p>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* MARKET STATS */}
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

      {/* CALCULATOR */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>Your budget</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-2">
            Run the numbers
          </h2>
          <p className="text-base text-text-secondary mb-10">
            See how VoC compares to traditional influencer marketing.
          </p>

          {/* Sliders */}
          <div className="space-y-8 mb-10">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Monthly content budget</span>
                <span className="text-lg font-bold text-accent">
                  ${budget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={50000}
                step={1000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-bg-elevated cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(245,166,35,0.4)]"
              />
              <div className="flex justify-between text-xs text-text-dim mt-1">
                <span>$5K</span>
                <span>$50K</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Videos needed per month</span>
                <span className="text-lg font-bold text-accent">{videos}</span>
              </div>
              <input
                type="range"
                min={30}
                max={360}
                step={10}
                value={videos}
                onChange={(e) => setVideos(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-bg-elevated cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(245,166,35,0.4)]"
              />
              <div className="flex justify-between text-xs text-text-dim mt-1">
                <span>30</span>
                <span>360</span>
              </div>
            </div>
          </div>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h4 className="text-sm font-semibold mb-2">Influencer marketing</h4>
              <div className="text-[28px] font-extrabold tracking-tight text-red">
                ${influencerCost.toLocaleString()}
              </div>
              <div className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                $500/video avg · 2-4 week lead time · Limited usage rights
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border-accent">
              <h4 className="text-sm font-semibold mb-2">Vo Creations UGC</h4>
              <div className="text-[28px] font-extrabold tracking-tight text-green">
                ${budget.toLocaleString()}
              </div>
              <div className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                ~${Math.round(vocCostPerVideo)}/video · 9-day launch · Full
                ownership · VoC Method
              </div>
            </div>
          </div>

          {/* Savings */}
          {savings > 0 && (
            <div className="bg-green/[0.06] border border-green/[0.12] rounded-2xl p-6 text-center mt-5">
              <div className="text-4xl font-extrabold text-green tracking-tight">
                ${savings.toLocaleString()}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                saved per month ({savingsPercent}% less)
              </div>
            </div>
          )}
        </div>
      </section>

      <CTABlock
        heading="Want these creators on your campaign?"
        sub="We match creators to your brand, audience, and goals. No marketplace. Handpicked."
        buttonText="Apply for a campaign slot →"
      />

      {/* Mentorship link */}
      <div className="text-center py-10">
        <Link
          href="/mentorship"
          className="text-sm text-text-secondary hover:text-text transition-colors underline underline-offset-4 decoration-white/15"
        >
          Want to become a creator? Learn more here →
        </Link>
      </div>

      <Footer />
    </>
  );
}
