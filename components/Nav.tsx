"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/about", label: "For Brands" },
  { href: "/mentorship", label: "For Creators" },
  { href: "/blog", label: "Blog" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg/80 backdrop-blur-[20px] border-b border-border">
      <div className="px-6 md:px-8 py-4 flex justify-between items-center">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex flex-col leading-none"
        >
          <span className="text-lg font-extrabold tracking-tight text-text">
            Vo <span className="text-accent">Creations</span>
          </span>
          <span className="text-[10px] text-text-dim [font-variant:small-caps] tracking-[0.12em] mt-1">
            make them remember.
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                pathname === link.href
                  ? "text-accent"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://calendar.app.google/BMAP5qH6Qwtkm5Yr5"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-bg font-bold text-[13px] px-5 md:px-6 py-2.5 rounded-full hover:shadow-[0_0_24px_rgba(245,166,35,0.3)] hover:-translate-y-px transition-all"
          >
            Apply for a slot
          </a>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-text -mr-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              {open ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden border-t border-border transition-all duration-300 ease-out ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`py-3 text-[15px] font-medium border-b border-border last:border-b-0 ${
                pathname === link.href ? "text-accent" : "text-text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
