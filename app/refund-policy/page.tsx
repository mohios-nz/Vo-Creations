import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Label from "@/components/Label";
import Link from "next/link";

const mentorshipDelivery = [
  "6 course modules covering how to land UGC brand deals.",
  "Weekly group coaching calls for the duration of the Program.",
  "60 days of weekly 1-on-1 check-in calls.",
  "Done-for-you outreach scripts and portfolio templates.",
  "Access to the VoC Discord server, the private brand deal opportunities channel, and the VoC creator network for referrals.",
  "Program duration: 4 months. Access is granted immediately upon enrollment and confirmation of the deposit payment.",
];

const guaranteeRequirements = [
  "100% attendance of scheduled group coaching calls.",
  "100% attendance of scheduled 1-on-1 check-in calls.",
  "100% completion of all course modules.",
  "100% execution of all tasks, outreach, and assignments provided by VoC.",
];

export default function RefundPolicyPage() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="pt-[160px] pb-16 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <Label>Legal and policies</Label>
          <h1 className="text-[clamp(32px,5vw,52px)] font-black leading-[1.05] tracking-tighter mb-6">
            Refund <span className="text-accent">Policy</span>
          </h1>
          <p className="text-[clamp(15px,1.6vw,17px)] text-text-secondary max-w-[560px] mx-auto leading-relaxed">
            Last updated: May 2026. Applies to all Vo Creations products and services.
          </p>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* OVERVIEW */}
      <section className="pt-[80px] pb-[40px] px-6">
        <div className="max-w-[720px] mx-auto flex gap-5 items-start">
          <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
            01
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] md:text-[22px] font-extrabold tracking-tight mb-3">
              Overview
            </h2>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              Vo Creations LLC ("VoC") offers a creator mentorship program and digital products. Because our work involves the delivery of digital services and live coaching, refunds are subject to the conditions outlined below. By completing a purchase or enrolling in any program, you acknowledge and agree to this policy. For mentorship enrollments, this policy is supplemental to your signed Mentorship Program Agreement, which governs the full terms of the engagement.
            </p>
          </div>
        </div>
      </section>

      {/* MENTORSHIP PROGRAM — primary section */}
      <section className="py-[40px] px-6">
        <div className="max-w-[720px] mx-auto flex gap-5 items-start">
          <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
            02
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] md:text-[22px] font-extrabold tracking-tight mb-3">
              Mentorship Program
            </h2>
            <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
              The following applies to the Vo Creations Mentorship Program, including all coaching, course modules, community access, and templates provided under the Mentorship Program Agreement.
            </p>

            {/* Delivery */}
            <h3 className="text-[15px] font-bold tracking-tight mb-3">
              What you receive and when
            </h3>
            <ul className="flex flex-col divide-y divide-border bg-bg-card rounded-2xl border border-border overflow-hidden mb-8">
              {mentorshipDelivery.map((d, idx) => (
                <li
                  key={idx}
                  className="text-[15px] text-text-secondary leading-relaxed px-5 py-4"
                >
                  {d}
                </li>
              ))}
            </ul>

            {/* First-month trial */}
            <h3 className="text-[15px] font-bold tracking-tight mb-3">
              First-month performance trial
            </h3>
            <p className="text-[15px] text-text-secondary leading-relaxed mb-8">
              If Student does not generate over <span className="text-text font-semibold">$500 in paid brand deals</span> within the first month of the Program, Student is released from any remaining installment obligations and the payment plan is cancelled. The trial covers future installments only and does not entitle Student to a refund of the deposit or any amounts already paid.
            </p>

            {/* Performance Guarantee */}
            <div className="bg-accent/[0.04] border border-accent/20 rounded-2xl p-6 mb-8">
              <div className="text-[11px] font-semibold tracking-[2.5px] uppercase text-accent mb-3">
                4-month performance guarantee
              </div>
              <p className="text-[15px] text-text-secondary leading-relaxed mb-4">
                If Student does not land three (3) paid brand deals within four (4) months of the Effective Date, VoC will:
              </p>
              <ul className="flex flex-col gap-2 mb-4 pl-4">
                <li className="text-[15px] text-text-secondary leading-relaxed list-disc">
                  Refund 100% of the fees paid by Student.
                </li>
                <li className="text-[15px] text-text-secondary leading-relaxed list-disc">
                  Pay Student an additional <span className="text-text font-semibold">$1,000 USD</span> within 7 days of refund approval.
                </li>
                <li className="text-[15px] text-text-secondary leading-relaxed list-disc">
                  Continue working with Student until Student lands their first paid brand deal.
                </li>
              </ul>
              <p className="text-[15px] text-text-secondary leading-relaxed mb-3">
                This guarantee applies <span className="text-text font-semibold">only</span> if Student has completed all of the following:
              </p>
              <ul className="flex flex-col gap-2 mb-4 pl-4">
                {guaranteeRequirements.map((r, idx) => (
                  <li
                    key={idx}
                    className="text-[15px] text-text-secondary leading-relaxed list-disc"
                  >
                    {r}
                  </li>
                ))}
              </ul>
              <p className="text-[14px] text-text-dim leading-relaxed">
                "Paid brand deal" means a signed engagement with cash compensation, regardless of dollar amount. Gifted products, commission-only deals, and unpaid collaborations do not count. If Student fails to meet any of the completion requirements above, no refund or additional payment is owed.
              </p>
            </div>

            {/* Cancellation and non-refundable terms */}
            <h3 className="text-[15px] font-bold tracking-tight mb-3">
              Cancellation and non-refundable terms
            </h3>
            <ul className="flex flex-col divide-y divide-border bg-bg-card rounded-2xl border border-border overflow-hidden mb-8">
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                Student may cancel at any time. Cancellation does not entitle Student to a refund except as provided under the Performance Guarantee above.
              </li>
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                Each installment is <span className="text-text font-semibold">non-refundable</span> once paid, except as provided under the Performance Guarantee.
              </li>
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                If Student fails to make a scheduled payment, access to the Program and community is immediately suspended until payment is resolved.
              </li>
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                If Student drops out, fails to complete payment, violates the Mentorship Program Agreement, or is removed for breach of the Code of Conduct, access is immediately revoked and no refund is owed.
              </li>
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                Results are not guaranteed beyond the Performance Guarantee terms above. Outcomes depend on individual effort, consistency, and implementation. Dissatisfaction with outcomes is not grounds for a refund.
              </li>
            </ul>

            <p className="text-[13px] text-text-dim leading-relaxed">
              Access logs, attendance, and assignment completion are recorded. Refund eligibility under the Performance Guarantee is verified against platform activity data and submitted deliverables.
            </p>
          </div>
        </div>
      </section>

      {/* DIGITAL PRODUCTS */}
      <section className="py-[40px] px-6">
        <div className="max-w-[720px] mx-auto flex gap-5 items-start">
          <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
            03
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] md:text-[22px] font-extrabold tracking-tight mb-3">
              Delivery of digital products
            </h2>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              All digital products (templates, guides, toolkits) are delivered immediately upon purchase via email or dashboard access. Due to the instant nature of digital delivery, all digital product sales are <span className="text-text font-semibold">final and non-refundable</span> once the product has been accessed or downloaded.
            </p>
          </div>
        </div>
      </section>

      {/* REFUND PROCESSING */}
      <section className="pt-[40px] pb-[80px] px-6">
        <div className="max-w-[720px] mx-auto flex gap-5 items-start">
          <div className="w-11 h-11 min-w-[44px] bg-bg-elevated rounded-[10px] flex items-center justify-center text-[15px] font-bold text-accent">
            04
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] md:text-[22px] font-extrabold tracking-tight mb-3">
              Refund processing
            </h2>
            <p className="text-[15px] text-text-secondary leading-relaxed mb-3">
              Approved refunds are issued to the original payment method. We do not issue refunds in cash, store credit, or to alternate payment methods.
            </p>
            <ul className="flex flex-col divide-y divide-border bg-bg-card rounded-2xl border border-border overflow-hidden">
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                <span className="text-text font-semibold">Mentorship:</span> approved refunds are processed within 7 to 10 business days of approval.
              </li>
              <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
                <span className="text-text font-semibold">Digital products:</span> not refundable once accessed or downloaded.
              </li>
            </ul>
            <p className="text-[13px] text-text-dim leading-relaxed mt-3">
              Processing times beyond approval are subject to your bank or card issuer.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* DISPUTE RESOLUTION */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto">
          <Label>Required process</Label>
          <h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold tracking-tight mb-3">
            Dispute resolution
          </h2>
          <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
            Before initiating any dispute or chargeback with your bank or payment provider, you are required to contact Vo Creations directly and allow us the opportunity to resolve the issue.
          </p>

          <ul className="flex flex-col divide-y divide-border bg-bg-card rounded-2xl border border-border overflow-hidden mb-8">
            <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
              Email:{" "}
              <a
                href="mailto:hello@vocreations.com"
                className="text-accent hover:underline font-semibold"
              >
                hello@vocreations.com
              </a>
            </li>
            <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
              We will respond within{" "}
              <span className="text-text font-semibold">2 business days</span>.
            </li>
            <li className="text-[15px] text-text-secondary leading-relaxed px-5 py-4">
              By completing a purchase, you agree to exhaust this resolution process before contacting your financial institution.
            </li>
          </ul>

          <div className="bg-red/[0.04] border border-red/20 rounded-2xl p-6">
            <div className="text-[11px] font-semibold tracking-[2.5px] uppercase text-red mb-3">
              Unauthorized chargebacks
            </div>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              Filing a chargeback outside of the terms of this policy constitutes a breach of this agreement. Vo Creations reserves the right to contest all unauthorized chargebacks with full documentation, pursue recovery of funds through available legal and collections channels, and permanently revoke access to all programs and services. Access is revoked immediately upon any chargeback filing.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto h-px bg-border" />

      {/* EXCEPTIONS + AGREEMENT */}
      <section className="py-[100px] px-6">
        <div className="max-w-[720px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-[17px] font-bold tracking-tight mb-3">
              Exceptions and special circumstances
            </h3>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              Vo Creations may, at its sole discretion, issue partial credits or exceptions in the case of documented emergencies or extenuating circumstances. These are evaluated on a case-by-case basis and do not set a precedent for future requests. No exception is guaranteed.
            </p>
          </div>
          <div className="bg-accent/[0.04] rounded-2xl p-6 border border-accent/20">
            <h3 className="text-[17px] font-bold tracking-tight mb-3 text-accent">
              Agreement
            </h3>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              By completing a purchase or enrolling in any Vo Creations program, you confirm that you have read, understood, and agreed to this refund policy. For mentorship enrollments, the signed Mentorship Program Agreement governs and prevails over any conflicting terms in this policy. This policy is binding from the moment payment is processed.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="text-center py-20 bg-bg-card">
        <h3 className="text-[24px] md:text-[28px] font-extrabold tracking-tight mb-3">
          Questions about this policy?
        </h3>
        <p className="text-base text-text-secondary mb-6">
          Reach us directly and we&apos;ll get back to you within 2 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:hello@vocreations.com"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Email hello@vocreations.com &rarr;
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 bg-transparent text-text font-medium text-base px-9 py-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all"
          >
            About Vo Creations &rarr;
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
