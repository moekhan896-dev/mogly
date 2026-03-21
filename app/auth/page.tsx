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
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
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

        {/* Google OAuth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-bg-card border border-white/[0.06] py-3.5 text-sm font-semibold text-text-primary transition-colors hover:border-white/10 disabled:opacity-50 mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

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
