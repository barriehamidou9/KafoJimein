import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20sign%20in%20to%20continue.");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">KafoJimein</h1>
      <p>Welcome back.</p>
    </main>
  );
}