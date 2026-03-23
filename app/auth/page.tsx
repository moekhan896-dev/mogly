"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signin" ? "signin" : "signup"
  );
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
        // SIGNUP
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // Success - show message
        setSuccess(
          "Account created! Logging you in..."
        );

        // Try to auto-login if email confirmation is disabled
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Auto-logged in
          window.location.href = "/dashboard";
        } else {
          // Try explicit login as fallback
          const { error: signinError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signinError) {
            window.location.href = "/dashboard";
          } else {
            setError("Account created but auto-login failed. Try signing in below.");
            setMode("signin");
            setLoading(false);
            setSuccess(null);
          }
        }
      } else {
        // SIGNIN
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        // Success
        setSuccess("Signed in! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <h1 className="text-center text-3xl font-bold text-text-primary mb-2">
          Mogly
        </h1>
        <p className="text-center text-sm text-text-muted mb-8">
          {mode === "signup"
            ? "Create your account to save your skin insights"
            : "Sign in to access your skin profile"}
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-accent-red/10 border border-accent-red/20 p-4">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-accent-green/10 border border-accent-green/20 p-4">
            <p className="text-sm text-accent-green">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
            />
            {mode === "signup" && (
              <p className="text-xs text-text-muted mt-1">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-green py-3 font-bold text-black hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading
              ? mode === "signup"
                ? "Creating..."
                : "Signing in..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.1]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-primary text-text-muted">or</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] py-3 font-semibold text-white hover:bg-white/[0.1] disabled:opacity-50 transition-all mb-6"
        >
          Continue with Google
        </button>

        {/* Toggle Mode */}
        <div className="text-center">
          <p className="text-sm text-text-muted mb-3">
            {mode === "signup"
              ? "Already have an account?"
              : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
              setSuccess(null);
              setEmail("");
              setPassword("");
            }}
            className="text-sm text-accent-green hover:text-accent-gold transition-colors font-semibold"
          >
            {mode === "signup" ? "Sign In Instead" : "Create Account"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthInner />
    </Suspense>
  );
}
