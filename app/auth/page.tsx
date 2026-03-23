"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Suspense } from "react";
import Link from "next/link";

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
          },
        });

        if (signUpError) throw signUpError;
        setSuccess("Check your email for a confirmation link!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <h1 className="text-center text-2xl font-bold text-text-primary mb-2">
          Mogly
        </h1>
        <p className="text-center text-sm text-text-muted mb-8">
          {mode === "signup"
            ? "Create an account to save your results"
            : "Sign in to your account"}
        </p>

        {/* Google OAuth - HIDDEN (not configured) */}

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-bg-card border border-white/[0.06] px-4 py-3 text-sm text-text-primary placeholder-text-muted/50 outline-none focus:border-accent-green/40 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg bg-bg-card border border-white/[0.06] px-4 py-3 text-sm text-text-primary placeholder-text-muted/50 outline-none focus:border-accent-green/40 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-4 py-2.5">
              <p className="text-xs text-accent-red">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-accent-green/10 border border-accent-green/20 px-4 py-2.5">
              <p className="text-xs text-accent-green">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-green py-3.5 text-sm font-bold text-black transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-6 text-center text-xs text-text-muted">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-accent-green hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-accent-green hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>

        <Link
          href="/"
          className="mt-8 block text-center text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-bg-primary">
          <p className="text-sm text-text-muted">Loading...</p>
        </main>
      }
    >
      <AuthInner />
    </Suspense>
  );
}
