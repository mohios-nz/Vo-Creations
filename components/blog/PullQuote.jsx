"use client";
import { tokens } from "./tokens";
import { useInView } from "./hooks/useInView";

export default function PullQuote({ children, attribution, variant = "insight" }) {
  const [ref, inView] = useInView();

  const isTestimonial = variant === "testimonial";

  return (
    <blockquote
      ref={ref}
      style={{
        maxWidth: tokens.prose.maxWidth,
        margin: "56px auto",
        padding: "0 24px",
        textAlign: "center",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div
        style={{
          fontFamily: tokens.fonts.display,
          fontSize: "48px",
          lineHeight: 1,
          color: tokens.colors.accent,
          marginBottom: "8px",
        }}
      >
        &ldquo;
      </div>
      <p
        style={{
          fontFamily: tokens.fonts.display,
          fontWeight: 700,
          fontSize: isTestimonial ? "20px" : "24px",
          lineHeight: 1.5,
          color: tokens.colors.text,
          fontStyle: "italic",
          margin: "0 0 16px",
        }}
      >
        {children}
      </p>
      {attribution && (
        <cite
          style={{
            fontFamily: tokens.fonts.mono,
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: tokens.colors.textDim,
            fontStyle: "normal",
          }}
        >
          {attribution}
        </cite>
      )}
    </blockquote>
  );
}
