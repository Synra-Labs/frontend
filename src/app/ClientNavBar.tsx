// src/app/ClientNavBar.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/app/styles/ClientNavBar.css";

// If you added a brand file, you can do:
// import { BRAND } from "@/theme/brand";
// const BRAND_NAME = BRAND.name;
const BRAND_NAME = "NSPIRE™";

export default function ClientNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // click outside to close on mobile
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      const el = navRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  return (
    <header className="navbar" ref={navRef} aria-label="Primary">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" aria-label="Home">
          {BRAND_NAME}
        </Link>

        <nav className={`navbar-links ${menuOpen ? "active" : ""}`} id="site-nav">
          <Link href="/models" className={pathname === "/models" ? "active" : ""}>
            MODELS
          </Link>
          <Link href="/modify" className={pathname === "/modify" ? "active" : ""}>
            MODIFY
          </Link>
          <Link href="/chat" className={pathname === "/chat" ? "active" : ""}>
            CHAT
          </Link>
          <Link href="/train" className={pathname === "/train" ? "active" : ""}>
            TRAIN
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="hamburger-btn"
          aria-label="Toggle menu"
          aria-controls="site-nav"
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>
    </header>
  );
}
