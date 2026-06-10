export default function CTABlock({
  heading = "Ready to scale with UGC?",
  sub = "10 new campaigns per month. Tell us about your brand.",
  buttonText = "make them remember. →",
  href = "https://calendar.app.google/BMAP5qH6Qwtkm5Yr5",
}: {
  heading?: string;
  sub?: string;
  buttonText?: string;
  href?: string;
}) {
  return (
    <section className="text-center py-20 bg-bg-card">
      <h3 className="text-[28px] font-extrabold tracking-tight mb-3">
        {heading}
      </h3>
      <p className="text-base text-text-secondary mb-6">{sub}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all"
      >
        {buttonText}
      </a>
    </section>
  );
}
