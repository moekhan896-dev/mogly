"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { ScanResult } from "@/lib/scores";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string; created_at?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [hasUnsavedScan, setHasUnsavedScan] = useState(false);

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        const [scansRes, profileRes, streakRes] = await Promise.all([
          supabase.from("scans").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
          supabase.from("profiles").select("subscription_status").eq("id", session.user.id).single(),
          supabase.from("user_streaks").select("current_streak").eq("user_id", session.user.id).single(),
        ]);

        if (scansRes.data) setScans(scansRes.data);
        if (profileRes.data) setIsPremium(profileRes.data.subscription_status === "premium");
        if (streakRes.data) setStreak(streakRes.data.current_streak || 0);
      } else {
        // Check for unsaved anonymous scan
        const lastScanId = localStorage.getItem("mogly_last_scan_id");
        if (lastScanId) setHasUnsavedScan(true);
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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setFormLoading(false); return; }
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
      if (password.length < 6) { setError("Password must be at least 6 characters"); setFormLoading(false); return; }
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setFormLoading(false); return; }
      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDaysAgo = (date: string): string => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  const memberSince = (user: { created_at?: string } | null): string => {
    if (!user?.created_at) return "";
    return new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const buildTrend = (scans: ScanResult[]): string => {
    if (scans.length < 2) return "";
    const recent = [...scans].reverse().slice(-5);
    return recent.map((s) => s.overall_score).join(" → ");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading...</p>
      </main>
    );
  }

  // ── NOT LOGGED IN ──
  if (!user) {
    return (
      <main className="min-h-screen bg-bg-primary px-6 py-10 pb-24">
        <div className="max-w-md mx-auto">
          {/* Unsaved scan banner */}
          {hasUnsavedScan && (
            <div className="mb-6 rounded-xl bg-accent-green/10 border border-accent-green/30 p-4 text-center">
              <p className="text-sm font-semibold text-text-primary mb-1">You have 1 unsaved scan</p>
              <p className="text-xs text-text-muted">Create an account to save your results and track progress over time.</p>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-text-muted text-sm">
              {mode === "signin"
                ? "Sign in to access your scan history"
                : "Save your scans and track your skin journey"}
            </p>
          </div>

          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3 mb-6">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors" />
            <input type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors" />

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={formLoading}
              className="w-full rounded-xl bg-accent-green py-3.5 text-black font-bold text-base hover:brightness-110 disabled:opacity-50 transition-all">
              {formLoading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mb-2">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <div className="text-center">
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setEmail(""); setPassword(""); }}
              className="text-accent-green font-semibold hover:brightness-125 transition-all">
              {mode === "signin" ? "Create account →" : "← Sign in instead"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const totalScans = scans.length;
  const bestScore = totalScans > 0 ? Math.max(...scans.map((s) => s.overall_score)) : 0;
  const trend = buildTrend(scans);
  const latestScore = totalScans > 0 ? scans[0].overall_score : null;
  const prevScore = totalScans > 1 ? scans[1].overall_score : null;
  const scoreChange = latestScore !== null && prevScore !== null ? latestScore - prevScore : null;

  // ── LOGGED IN ──
  return (
    <main className="min-h-screen bg-bg-primary pb-28">
      <div className="max-w-md mx-auto px-6 py-8">

        {/* ── Profile Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-primary">{user.email?.split("@")[0]}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isPremium ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/30" : "bg-white/[0.06] text-text-muted border border-white/[0.08]"
              }`}>
                {isPremium ? "⭐ Premium" : "Free"}
              </span>
            </div>
            <p className="text-xs text-text-muted">{user.email}</p>
            {user.created_at && (
              <p className="text-xs text-text-muted/60 mt-0.5">Member since {memberSince(user)}</p>
            )}
          </div>
          <div className="text-right">
            {streak > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold text-text-primary">{streak}</span>
                <span className="text-xs text-text-muted">day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Skin Journey ── */}
        {totalScans > 0 && (
          <div className="bg-bg-card rounded-2xl border border-white/[0.06] p-5 mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Your Skin Journey</p>

            {/* Score trend */}
            {trend && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {trend.split(" → ").map((score, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold ${i === arr.length - 1 ? "text-accent-green" : "text-text-muted"}`}>
                      {score}
                    </span>
                    {i < arr.length - 1 && <span className="text-accent-green text-sm">→</span>}
                  </span>
                ))}
                {scoreChange !== null && (
                  <span className={`ml-1 text-sm font-bold ${scoreChange > 0 ? "text-accent-green" : scoreChange < 0 ? "text-red-400" : "text-text-muted"}`}>
                    {scoreChange > 0 ? `+${scoreChange} 📈` : scoreChange < 0 ? `${scoreChange} 📉` : "→ stable"}
                  </span>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-base font-bold text-text-primary">{totalScans}</p>
                <p className="text-[10px] text-text-muted">Scans</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div>
                <p className="text-base font-bold text-accent-green">{bestScore}</p>
                <p className="text-[10px] text-text-muted">Best</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div>
                <p className="text-base font-bold text-text-primary">{streak}</p>
                <p className="text-[10px] text-text-muted">Streak</p>
              </div>
              {latestScore !== null && (
                <>
                  <div className="w-px bg-white/[0.06]" />
                  <div>
                    <p className="text-base font-bold text-text-primary">{latestScore}</p>
                    <p className="text-[10px] text-text-muted">Latest</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Scan Library ── */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text-primary">Scan Library</h2>
          {totalScans > 0 && (
            <span className="text-xs text-text-muted">{totalScans} scan{totalScans !== 1 ? "s" : ""}</span>
          )}
        </div>

        {scans.length > 0 ? (
          <div className="space-y-2.5 mb-6">
            {scans.map((scan, idx) => {
              const prevScanScore = idx < scans.length - 1 ? scans[idx + 1].overall_score : null;
              const change = prevScanScore !== null ? scan.overall_score - prevScanScore : null;

              return (
                <Link key={scan.id} href={`/results/${scan.id}`}
                  className="flex items-center gap-3 bg-bg-card rounded-xl p-3.5 border border-white/[0.06] hover:border-accent-green/30 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/20">
                    {scan.image_url ? (
                      <img src={scan.image_url} alt="Scan" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base">📊</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-text-primary">{scan.overall_score}</span>
                      {change !== null && (
                        <span className={`text-xs font-semibold ${change > 0 ? "text-accent-green" : change < 0 ? "text-red-400" : "text-text-muted"}`}>
                          {change > 0 ? `+${change}` : change < 0 ? `${change}` : "±0"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{formatDate(scan.created_at)} · {getDaysAgo(scan.created_at)}</p>
                  </div>

                  <span className="text-xs text-text-muted group-hover:text-accent-green transition-colors">
                    View →
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-8 text-center mb-6">
            <p className="text-3xl mb-3">📸</p>
            <p className="text-text-primary font-semibold mb-1">No scans yet</p>
            <p className="text-text-muted text-sm">Take your first AI skin scan to see your score</p>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="space-y-3">
          <Link href="/scan"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent-green py-3.5 text-black font-bold text-base hover:brightness-110 transition-all">
            📸 New Scan
          </Link>
          <button onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-white/[0.08] text-text-muted hover:text-text-primary hover:border-white/[0.15] transition-colors text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
