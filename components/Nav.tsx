"use client";

// ==========================================
// Next.js utilities
// A client component (not the page itself) so it can read the current
// route via usePathname() to highlight the active nav link — the same
// Nav renders on every page, so this needs to live in shared state, not
// duplicated per-page logic.
// ==========================================

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ==========================================
// Components
// ==========================================

import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/budgets", label: "Budgets" },
  { href: "/categories", label: "Categories" },
  { href: "/recurring", label: "Recurring" },
  { href: "/transactions", label: "Transactions" },
];

// A small gear icon for Settings — collapsed to icon-only in the nav
// rather than a text label. Hand-drawn rather than pulling in an icon
// library for two icons (see also the log-out icon in LogoutButton).
function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Hamburger / close icons for the mobile menu toggle — same hand-drawn
// stroke style as GearIcon (currentColor, no fill, round caps), just a
// touch larger since this is the primary mobile nav trigger.
function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();

  // Mobile menu open/closed. Irrelevant at sm:+ — the <nav> below is
  // forced visible there regardless of this state (see its className).
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="relative border-b border-border bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={closeMenu}
        >
          {/* Logo mark: house (white, fixed — not a theme color, since it
              must stay high-contrast against the green square in both
              themes) with a small heart "cut out" in fill-accent so it
              reads as a hole revealing the square behind it. */}
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="12,4 20,11 4,11" fill="white" />
              <rect x="6" y="11" width="12" height="9" fill="white" />
              <path
                d="M12,18.2 C12,18.2 9,16.3 9,14.6 C9,13.5 9.8,12.7 10.9,12.7 C11.5,12.7 12,13.1 12,13.6 C12,13.1 12.5,12.7 13.1,12.7 C14.2,12.7 15,13.5 15,14.6 C15,16.3 12,18.2 12,18.2 Z"
                className="fill-accent"
              />
            </svg>
          </div>

          <div>
            <p className="text-[17px] font-medium text-accent">
              KafoJimein
            </p>
            <p className="text-[12px] text-muted">Family finance</p>
          </div>
        </Link>

        {/* Hamburger — mobile only, toggles the <nav> below. */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex min-h-11 min-w-11 items-center justify-center text-secondary transition hover:text-primary sm:hidden"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Single <nav> for both roles — there is only ever one
            <ThemeToggle /> and one <LogoutButton /> in the tree, never
            two mounted at once. Below sm: it's a `menuOpen`-driven
            absolute dropdown panel (flex-col, full width, stacked
            min-h-11 rows); at sm:+ the sm: classes override every one
            of those — including forcing display:flex regardless of
            menuOpen, since Tailwind emits responsive variants after
            base utilities, so `sm:flex` wins the cascade over a plain
            `hidden` at that breakpoint — reproducing the exact original
            horizontal row untouched. */}
        <nav
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute inset-x-0 top-full z-20 flex-col border-b border-border bg-surface-card sm:static sm:z-auto sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-5 sm:border-none sm:bg-transparent`}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`flex min-h-11 items-center px-6 text-[14px] transition sm:min-h-0 sm:px-0 ${
                  isActive
                    ? "text-primary"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/settings"
            onClick={closeMenu}
            aria-label="Settings"
            title="Settings"
            className={`flex min-h-11 items-center gap-2 px-6 text-[14px] transition sm:min-h-0 sm:px-0 ${
              pathname === "/settings"
                ? "text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            <GearIcon />
            {/* Icon-only on desktop, matching the original exactly —
                labeled on mobile so it doesn't read as a stray icon
                among the other text rows. */}
            <span className="sm:hidden">Settings</span>
          </Link>

          {/* onClick here closes the mobile menu on any click inside —
              ThemeToggle's own button click still fires and bubbles up
              to this div (it doesn't call stopPropagation), so the
              theme toggles AND the menu closes. Inert on desktop since
              the menu is never open there. */}
          <div
            onClick={closeMenu}
            className="flex min-h-11 items-center px-6 sm:min-h-0 sm:px-0"
          >
            <ThemeToggle />
          </div>

          <div className="flex min-h-11 items-center px-6 sm:min-h-0 sm:px-0">
            <LogoutButton />
          </div>
        </nav>
      </div>

      {/* Backdrop: tapping outside the open mobile panel closes it.
          sm:hidden guards against a stale menuOpen=true lingering if the
          viewport is resized past the breakpoint without a reload. */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
          className="fixed inset-0 z-10 bg-black/20 sm:hidden"
        />
      )}
    </header>
  );
}
