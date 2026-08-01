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
    <p className="rounded bg-yellow-100 p-3 text-yellow-800">{message}</p>
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Log in</h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
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
          className="rounded border px-3 py-2"
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
          className="rounded border px-3 py-2"
        />

        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          Enter
        </button>
      </form>

      <Suspense fallback={null}>
        <LoginMessage />
      </Suspense>
    </main>
  );
}