"use client";

// ==========================================
// Next.js utilities
// A client component (not the page itself) so it can read the current
// route via usePathname() to highlight the active nav link — the same
// Nav renders on every page, so this needs to live in shared state, not
// duplicated per-page logic.
// ==========================================

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

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="block">
          <p className="text-[17px] font-medium text-primary">KafoJimein</p>
          <p className="text-[12px] text-muted">Family finance</p>
        </Link>

        <nav className="flex items-center gap-5">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-[14px] text-primary"
                    : "text-[14px] text-secondary transition hover:text-primary"
                }
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className={
              pathname === "/settings"
                ? "text-primary"
                : "text-secondary transition hover:text-primary"
            }
          >
            <GearIcon />
          </Link>

          <ThemeToggle />

          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
