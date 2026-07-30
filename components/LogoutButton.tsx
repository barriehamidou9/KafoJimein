"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// A small log-out icon — hand-drawn rather than pulling in an icon
// library for two icons (see also the gear icon in Nav).
function LogOutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
      <path d="M10.5 11.5 14 8l-3.5-3.5" />
      <path d="M14 8H6" />
    </svg>
  );
}

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-[14px] text-secondary transition hover:text-primary"
    >
      <LogOutIcon />
      Logout
    </button>
  );
}
