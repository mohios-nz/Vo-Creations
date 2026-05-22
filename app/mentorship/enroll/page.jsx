"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLANS = [
  {
    id: "full",
    badge: "SAVE $500",
    title: "Pay in Full",
    price: "$4,500",
    period: "one-time",
    description: "Best value — full access, no commitments after.",
    features: [
      "2-month intensive bootcamp",
      "Live coaching with Thienvu",
      "Month 3+: agency campaign access",
      "Private creator community",
      "$500 savings vs payment plan",
    ],
    cta: "Enroll & Save $500",
    highlight: true,
  },
  {
    id: "plan",
    badge: "FLEXIBLE",
    title: "Payment Plan",
    price: "$1,250",
    period: "\u00d7 4 monthly payments",
    description: "Same program, spread over 4 months.",
    features: [
      "2-month intensive bootcamp",
      "Live coaching with Thienvu",
      "Month 3+: agency campaign access",
      "Private creator community",
      "Access continues while payments are current",
    ],
    cta: "Enroll & Start Plan",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "When do I start?",
    a: "Immediately. Once you enroll, you get access to the community and materials right away. You'll join the next weekly coaching call with Thienvu \u2014 your 60 days start from enrollment.",
  },
  {
    q: "What if I can't keep up?",
    a: "The bootcamp is intense but designed for beginners. You'll have direct access to Thienvu and a community of creators going through it with you.",
  },
  {
    q: "What happens if I miss a payment?",
    a: "If you're on the payment plan and miss a payment, your access to the community and agency campaigns will be paused until payments are current.",
  },
  {
    q: "Do I need experience?",
    a: "No. The program is built to take you from zero to paid creator. Most of our successful creators started with no content experience.",
  },
  {
    q: "What's the time commitment?",
    a: "Plan for 8-10 hours per week during the bootcamp. The more you put in, the faster you'll get matched to campaigns.",
  },
];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="9" cy="9" r="9" fill="#16a34a" opacity="0.12" />
      <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.25s ease",
        flexShrink: 0,
      }}
    >
      <path d="M6 8L10 12L14 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: "18px 22px",
        borderRadius: 14,
        background: open ? "#f0fdf4" : "#fafafa",
        border: open ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "#1e293b", lineHeight: 1.4 }}>
          {item.q}
        </span>
        <ChevronIcon open={open} />
      </div>
      {open && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748b", marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function EnrollPageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fcfcfc" }} />}>
      <EnrollPage />
    </Suspense>
  );
}

function EnrollPage() {
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [loading, setLoading] = useState(null);
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  async function handleCheckout(planId) {
    setLoading(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#fcfcfc", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 520 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16.5L13.5 22L24 10" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-space), 'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 32, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            You&apos;re in!
          </h1>
          <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.6, marginBottom: 32 }}>
            Welcome to Vo Creators. Check your email for next steps &mdash; Thienvu will be in touch within 24 hours.
          </p>
          <a href="/mentorship" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            Back to Vo Creators
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fcfcfc", fontFamily: "'DM Sans', sans-serif" }}>
      {canceled && (
        <div style={{ background: "#fef3c7", padding: "12px 24px", textAlign: "center", fontSize: 14, color: "#92400e" }}>
          Payment was canceled. You can try again below.
        </div>
      )}
      {/* Nav */}
      <nav style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 14,
          }}>V</div>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#1e293b", letterSpacing: "-0.02em" }}>Vo Creators</span>
        </div>
        <a href="/mentorship" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>
          &larr; Back to mentorship
        </a>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 50px", maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "var(--font-space), 'Space Grotesk', sans-serif", fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.15,
          color: "#0f172a", margin: "0 0 16px",
          letterSpacing: "-0.03em",
        }}>
          Become a paid UGC<br />creator in 60 days
        </h1>
        <p style={{
          fontSize: 17, color: "#64748b", lineHeight: 1.6,
          maxWidth: 520, margin: "0 auto 8px",
        }}>
          The VoC Method bootcamp. Learn from Thienvu Vo, get live coaching, and earn your first paid campaign by month 3. Enroll anytime &mdash; your 60 days start when you do.
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 60px" }}>
        <h2 style={{
          fontFamily: "var(--font-space), 'Space Grotesk', sans-serif", fontWeight: 600,
          fontSize: 28, color: "#0f172a", textAlign: "center",
          marginBottom: 32, letterSpacing: "-0.02em",
        }}>
          Choose your path
        </h2>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                flex: "1 1 320px",
                maxWidth: 370,
                padding: "32px 28px",
                borderRadius: 20,
                background: plan.highlight ? "linear-gradient(180deg, #f0fdf4 0%, #ffffff 40%)" : "white",
                border: plan.highlight ? "2px solid #16a34a" : "1px solid #e5e7eb",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                transform: hoveredPlan === plan.id ? "translateY(-4px)" : "translateY(0)",
                boxShadow: hoveredPlan === plan.id
                  ? "0 20px 40px rgba(0,0,0,0.08)"
                  : plan.highlight
                    ? "0 8px 24px rgba(22,163,74,0.1)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Badge */}
              <div style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 100,
                background: plan.highlight ? "#16a34a" : "#f1f5f9",
                color: plan.highlight ? "white" : "#64748b",
                fontSize: 11, fontWeight: 700,
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}>
                {plan.badge}
              </div>

              <div style={{ fontWeight: 600, fontSize: 18, color: "#0f172a", marginBottom: 4 }}>
                {plan.title}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: "var(--font-space), 'Space Grotesk', sans-serif", fontWeight: 700,
                  fontSize: 40, color: "#0f172a", letterSpacing: "-0.03em",
                }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>
                  {plan.period}
                </span>
              </div>

              {plan.highlight && (
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12, textDecoration: "line-through" }}>
                  $5,000
                </div>
              )}
              {!plan.highlight && (
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  $5,000 total
                </div>
              )}

              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>
                {plan.description}
              </p>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CheckIcon />
                    <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: plan.highlight ? "none" : "1.5px solid #16a34a",
                  background: plan.highlight
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "white",
                  color: plan.highlight ? "white" : "#16a34a",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading && loading !== plan.id ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading === plan.id ? "Redirecting to checkout..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <p style={{
          textAlign: "center", fontSize: 13, color: "#94a3b8",
          marginTop: 24, lineHeight: 1.5,
        }}>
          Secure payment via Stripe &middot; Start immediately &middot; No hidden fees
        </p>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{
          fontFamily: "var(--font-space), 'Space Grotesk', sans-serif", fontWeight: 600,
          fontSize: 24, color: "#0f172a", textAlign: "center",
          marginBottom: 24, letterSpacing: "-0.02em",
        }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQ.map((item, i) => (
            <FAQItem key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "24px", textAlign: "center",
        borderTop: "1px solid #f1f5f9",
      }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          &copy; 2026 Vo Creations LLC &middot; vocreations.com
        </p>
      </div>
    </div>
  );
}
