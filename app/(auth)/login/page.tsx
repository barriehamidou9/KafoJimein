"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

// Isolated so only this part needs the Suspense boundary useSearchParams()
// requires during static generation — next build fails on this page
// otherwise ("useSearchParams() should be wrapped in a suspense
// boundary"), even though it works fine in dev. The rest of the page
// (form, submit handler) has no such requirement.
function LoginMessage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  if (!message) {
    return null;
  }

  return (
    <p className="mt-6 rounded-xl bg-warn/10 px-3 py-2 text-sm text-warn">
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createClient();

    // Wrapped in try/catch: signInWithPassword can throw (e.g. a network
    // failure) instead of resolving with { error }, which would otherwise
    // fail silently with no alert and no redirect.
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/");
    } catch (err) {
      alert(
        err instanceof Error
          ? `Login failed: ${err.message}`
          : "Login failed: something went wrong. Please try again."
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-8 text-center">
        {/* Logo mark — same house+heart paths as Nav.tsx's header logo,
            recolored for the card: a green tile (bg-accent) with a white
            house (text-on-accent via currentColor) instead of the
            header's white-tile/#0d4d3a variant. The heart "cuts out"
            via fill-accent — matching the tile's own background — the
            same token-driven technique used for the mark elsewhere,
            rather than a hardcoded hex. */}
        <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-on-accent">
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="12,4 20,11 4,11" fill="currentColor" />
            <rect x="6" y="11" width="12" height="9" fill="currentColor" />
            <path
              d="M12,18.2 C12,18.2 9,16.3 9,14.6 C9,13.5 9.8,12.7 10.9,12.7 C11.5,12.7 12,13.1 12,13.6 C12,13.1 12.5,12.7 13.1,12.7 C14.2,12.7 15,13.5 15,14.6 C15,16.3 12,18.2 12,18.2 Z"
              className="fill-accent"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-semibold text-primary">
          KafoJimein
        </h1>

        <p className="mt-1 text-sm text-secondary">
          Djaraama — welcome. Sign in to continue.
        </p>

        <Suspense fallback={null}>
          <LoginMessage />
        </Suspense>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 text-left"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 rounded-xl border border-border bg-surface-page px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 rounded-xl border border-border bg-surface-page px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
          />

          <button
            type="submit"
            className="mt-1 min-h-11 rounded-xl bg-accent px-4 py-3 font-medium text-on-accent transition hover:bg-accent-deep focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
