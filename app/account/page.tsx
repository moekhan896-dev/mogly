"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { ScanResult } from "@/lib/scores";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Fetch user's scans
        const { data: userScans } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (userScans) {
          setScans(userScans);
          setTotalScans(userScans.length);
          if (userScans.length > 0) {
            setBestScore(Math.max(...userScans.map((s) => s.overall_score)));
          }
        }

        // Fetch streak
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", session.user.id)
          .single();

        if (streakData) {
          setStreak(streakData.current_streak || 0);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setFormLoading(false);
        return;
      }

      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setFormLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setFormLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setFormLoading(false);
        return;
      }

      router.push("/scan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getDaysAgo = (date: string): string => {
    const scanDate = new Date(date);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading...</p>
      </main>
    );
  }

  // NOT LOGGED IN STATE
  if (!user) {
    return (
      <main className="min-h-screen bg-bg-primary px-6 py-12 pb-24">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Mogly</h1>
          <p className="text-text-muted mb-8">
            Sign in to save your scans and track your skin progress over time
          </p>

          <form
            onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            className="space-y-3 mb-6"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50"
            />

            {error && (
              <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 p-3">
                <p className="text-sm text-accent-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full rounded-lg bg-accent-green py-3 text-black font-bold hover:brightness-110 disabled:opacity-50"
            >
              {formLoading
                ? "..."
                : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <p className="text-text-muted mb-3">
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setEmail("");
              setPassword("");
            }}
            className="text-accent-green font-semibold hover:text-accent-gold"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </main>
    );
  }

  // LOGGED IN STATE
  return (
    <main className="min-h-screen bg-bg-primary px-6 py-8 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Your Account</h1>
        <p className="text-text-muted text-sm mb-6">{user.email}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-bg-card rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-bold text-text-primary">{totalScans}</p>
            <p className="text-[10px] text-text-muted mt-1">SCANS</p>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-bold text-accent-green">{bestScore}</p>
            <p className="text-[10px] text-text-muted mt-1">BEST SCORE</p>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-bold text-text-primary">{streak}</p>
            <p className="text-[10px] text-text-muted mt-1">DAY STREAK</p>
          </div>
        </div>

        {/* Scan Library */}
        <h2 className="text-lg font-bold text-text-primary mb-4">Your Scan Library</h2>

        {scans.length > 0 ? (
          <div className="space-y-3 mb-6">
            {scans.map((scan, idx) => {
              const prevScore =
                idx < scans.length - 1 ? scans[idx + 1].overall_score : null;
              const change = prevScore ? scan.overall_score - prevScore : null;

              return (
                <Link
                  key={scan.id}
                  href={`/results/${scan.id}`}
                  className="flex items-center gap-4 bg-bg-card rounded-xl p-4 border border-white/[0.06] hover:border-accent-green/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/20 flex-shrink-0 overflow-hidden">
                    {scan.image_url ? (
                      <img src={scan.image_url} alt="Scan" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg flex items-center justify-center w-full h-full">📊</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-semibold">
                      Score: {scan.overall_score}
                    </p>
                    <p className="text-text-muted text-xs">
                      {getDaysAgo(scan.created_at)}
                    </p>
                  </div>
                  {change !== null && (
                    <div
                      className={`text-sm font-bold ${
                        change > 0
                          ? "text-accent-green"
                          : change < 0
                          ? "text-accent-red"
                          : "text-text-muted"
                      }`}
                    >
                      {change > 0 ? "↑" : change < 0 ? "↓" : "−"}
                      {Math.abs(change)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-text-muted text-center py-8">
            No scans yet. Take your first scan!
          </p>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-6 py-3 rounded-xl border border-white/[0.1] text-text-muted hover:text-text-primary hover:border-white/[0.2] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
