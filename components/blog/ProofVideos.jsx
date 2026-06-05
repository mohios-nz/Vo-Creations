"use client";
import { useRef, useCallback } from "react";
import { tokens } from "./tokens";
import { useInView } from "./hooks/useInView";

const videos = [
  { src: "/videos/post-1.mp4", views: "3.8M", postUrl: "https://www.instagram.com/p/DTFU5uGjgqV/" },
  { src: "/videos/post-2.mp4", views: "3.7M", postUrl: "https://www.instagram.com/p/DTRCvh2E1Lu/" },
  { src: "/videos/post-3.mp4", views: "2.9M", postUrl: "https://www.instagram.com/p/DTGTfgsGI62/" },
];

function VideoCard({ v, i, inView }) {
  const vidRef = useRef(null);
  const playing = useRef(false);

  const handleMouseEnter = useCallback(() => {
    const vid = vidRef.current;
    if (vid) { vid.play(); playing.current = true; }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const vid = vidRef.current;
    if (vid) { vid.pause(); vid.currentTime = 0.001; playing.current = false; }
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    const vid = vidRef.current;
    if (!vid) return;

    // Mobile: tap to play/pause + unmute
    if (!playing.current) {
      vid.play();
      vid.muted = false;
      playing.current = true;
    } else {
      // Toggle mute on subsequent clicks
      vid.muted = !vid.muted;
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${tokens.colors.border}`,
        aspectRatio: "9/16",
        background: tokens.colors.surface,
        cursor: "pointer",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease",
        transitionDelay: `${i * 0.1}s`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={vidRef}
        src={`${v.src}#t=0.001`}
        playsInline
        muted
        loop
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          padding: "4px 10px",
          fontFamily: tokens.fonts.mono,
          fontSize: "12px",
          fontWeight: 700,
          color: tokens.colors.text,
        }}
      >
        {v.views} views
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "44px",
          left: "0",
          right: "0",
          textAlign: "center",
          fontFamily: tokens.fonts.mono,
          fontSize: "10px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.5px",
        }}
      >
        Tap to play
      </div>
      <a
        href={v.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          right: "12px",
          textAlign: "center",
          fontFamily: tokens.fonts.mono,
          fontSize: "10px",
          fontWeight: 600,
          color: tokens.colors.accent,
          letterSpacing: "0.5px",
          textDecoration: "none",
        }}
      >
        View on Instagram ↗
      </a>
    </div>
  );
}

export default function ProofVideos() {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      style={{
        maxWidth: "900px",
        margin: "48px auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {videos.map((v, i) => (
          <VideoCard key={v.src} v={v} i={i} inView={inView} />
        ))}
      </div>
      <p
        style={{
          fontFamily: tokens.fonts.mono,
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: tokens.colors.textDim,
          textAlign: "center",
          marginTop: "12px",
        }}
      >
        Real campaign videos. Tap to play, click Instagram link to view post
      </p>
    </div>
  );
}
