"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-ink/15 bg-vellum p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-patina">
          Family Archive
        </p>
        <h1 className="font-display mt-1 text-3xl text-ink">
          {mode === "sign_in" ? "Welcome back" : "Start your archive"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 text-ink outline-none focus-visible:border-patina"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 text-ink outline-none focus-visible:border-patina"
            />
          </div>

          {error && <p className="text-sm text-oxblood">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink px-4 py-2 font-mono text-sm uppercase tracking-wide text-vellum transition hover:bg-patina disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "sign_in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
          className="mt-4 font-body text-sm text-ink/70 underline underline-offset-2 hover:text-patina"
        >
          {mode === "sign_in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
