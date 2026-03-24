"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { ScanResult } from "@/lib/scores";

const DAILY_TIPS = [
  "Apply SPF 30+ every morning — even indoors, UV rays pass through glass.",
  "Double cleanse at night: oil cleanser first, then water-based.",
  "Niacinamide + hyaluronic acid is one of the safest combos for all skin types.",
  "Silk pillowcases reduce friction and can help with breakouts.",
  "Vitamin C works best applied in the morning before SPF.",
  "Patch test any new product for 48 hours before full use.",
  "Retinol should be introduced slowly — start 2x per week.",
  "Cold water to rinse keeps the skin barrier intact longer.",
];

function getDailyTip() {
  return DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
}

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
  const [lastScanId, setLastScanId] = useState<string | null>(null);

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showAllScans, setShowAllScans] = useState(false);

  useEffect(() => {
    document.title = "Mogly — Your Skin Dashboard";
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        const storedScanId = localStorage.getItem("mogly_last_scan_id");
        if (storedScanId) setLastScanId(storedScanId);

        // Link the localStorage scan to this user account
        if (storedScanId) {
          await fetch("/api/link-scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scanId: storedScanId }),
          });
        }

        const [scansRes, profileRes, streakRes] = await Promise.all([
          supabase.from("scans").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
          supabase.from("profiles").select("subscription_status").eq("id", session.user.id).single(),
          supabase.from("user_streaks").select("current_streak").eq("user_id", session.user.id).single(),
        ]);

        let foundScans = scansRes.data ?? [];

        // Fallback: fetch the localStorage scan directly if query returned nothing
        if (foundScans.length === 0 && storedScanId) {
          const { data: directScan } = await supabase.from("scans").select("*").eq("id", storedScanId).single();
          if (directScan) foundScans = [directScan];
        }

        setScans(foundScans);
        if (profileRes.data) setIsPremium(profileRes.data.subscription_status === "premium" || profileRes.data.subscription_status === "active" || profileRes.data.subscription_status === "trial");
        if (streakRes.data) setStreak(streakRes.data.current_streak || 0);
      } else {
        const storedScanId = localStorage.getItem("mogly_last_scan_id");
        if (storedScanId) { setHasUnsavedScan(true); setLastScanId(storedScanId); }
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

  const memberSince = (u: { created_at?: string } | null): string => {
    if (!u?.created_at) return "";
    return new Date(u.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const buildTrend = (s: ScanResult[]): string => {
    if (s.length < 2) return "";
    const recent = [...s].reverse().slice(-5);
    return recent.map((r) => r.overall_score).join(" → ");
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

          <button
            onClick={async () => {
              setError(null);
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getmogly.com";
              const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${appUrl}/auth/callback` },
              });
              if (oauthError) setError("Google sign-in failed. Try email instead.");
            }}
            className="flex items-center justify-center gap-3 w-full rounded-xl bg-white py-3.5 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors mb-4"
          >
            <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
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
  const tip = getDailyTip();

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

        {/* ── Quick Actions Grid ── */}
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Link href="/scan"
            className="flex flex-col items-center gap-2 bg-bg-card rounded-xl p-4 border border-white/[0.06] hover:border-accent-green/30 transition-colors">
            <span className="text-2xl">📸</span>
            <span className="text-xs font-semibold text-text-primary">New Scan</span>
          </Link>
          <Link href="/routine"
            className="flex flex-col items-center gap-2 bg-bg-card rounded-xl p-4 border border-white/[0.06] hover:border-accent-green/30 transition-colors">
            <span className="text-2xl">📋</span>
            <span className="text-xs font-semibold text-text-primary">Routine</span>
          </Link>
          <Link href="/coach"
            className="flex flex-col items-center gap-2 bg-bg-card rounded-xl p-4 border border-white/[0.06] hover:border-accent-green/30 transition-colors">
            <span className="text-2xl">💬</span>
            <span className="text-xs font-semibold text-text-primary">AI Coach</span>
          </Link>
        </div>

        {/* ── Daily Tip ── */}
        <div className="rounded-xl mb-6 p-4" style={{ backgroundColor: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)" }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#00E5A0" }}>💡 Daily Tip</p>
          <p className="text-xs text-text-muted leading-relaxed">{tip}</p>
        </div>

        {/* ── Scan Library ── */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text-primary">Scan Library</h2>
          {totalScans > 0 && (
            <span className="text-xs text-text-muted">{totalScans} scan{totalScans !== 1 ? "s" : ""}</span>
          )}
        </div>

        {scans.length > 0 ? (
          <div className="space-y-2.5 mb-6">
            {(showAllScans ? scans : scans.slice(0, 3)).map((scan, idx) => {
              const prevScanScore = idx < scans.length - 1 ? scans[idx + 1].overall_score : null;
              const change = prevScanScore !== null ? scan.overall_score - prevScanScore : null;
              return (
                <Link key={scan.id} href={`/results/${scan.id}`}
                  className="flex items-center gap-3 bg-bg-card rounded-xl p-3.5 border border-white/[0.06] hover:border-accent-green/30 transition-colors group">
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
                  <span className="text-xs text-text-muted group-hover:text-accent-green transition-colors">View →</span>
                </Link>
              );
            })}
            {scans.length > 3 && !showAllScans && (
              <button
                onClick={() => setShowAllScans(true)}
                style={{ width: "100%", padding: "14px", backgroundColor: "transparent", color: "#00E5A0", fontSize: "13px", fontWeight: "600", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "12px", cursor: "pointer", marginTop: "8px" }}
              >
                View All {scans.length} Scans →
              </button>
            )}
            {showAllScans && scans.length > 3 && (
              <button
                onClick={() => setShowAllScans(false)}
                style={{ width: "100%", padding: "10px", backgroundColor: "transparent", color: "#666", fontSize: "12px", border: "none", cursor: "pointer", marginTop: "8px" }}
              >
                Show Less
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-8 text-center mb-6">
            <p className="text-3xl mb-3">📸</p>
            <p className="text-text-primary font-semibold mb-1">No scans yet</p>
            <p className="text-text-muted text-sm">Take your first AI skin scan to see your score</p>
          </div>
        )}

        {/* ── Premium section ── */}
        {isPremium ? (
          <div className="rounded-2xl bg-accent-green/5 border border-accent-green/10 p-5 text-center mb-4">
            <p className="text-sm font-bold text-accent-green">✅ Premium Active</p>
            <p className="text-xs text-text-muted mt-1">Unlimited scans • Full coach access • Complete routines</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-accent-green/15 p-6 mb-4"
            style={{ background: "linear-gradient(135deg, rgba(0,229,160,0.08), rgba(0,180,216,0.08))" }}>
            <h3 className="text-lg font-bold text-text-primary mb-2">Unlock Your Full Potential</h3>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              Free accounts are limited to 1 scan with basic results. Premium members get:
            </p>
            <div className="space-y-2.5 mb-5">
              {[
                "Unlimited AI skin scans — track your progress weekly",
                "Complete 5-step treatment protocol with product recommendations",
                "AI Skin Coach — 100 personalized consultations per month",
                "Full daily morning & evening routine with checkoff tracking",
                "Score progress tracking — see your skin improve over time",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="text-accent-green text-xs mt-0.5 shrink-0">✓</span>
                  <span className="text-xs text-text-muted leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted/60 text-center mb-3">Average improvement: 18 points in 30 days</p>
            <a
              href={lastScanId ? `/results/${lastScanId}` : "/scan"}
              className="flex items-center justify-center w-full rounded-xl bg-accent-green py-4 text-black font-bold text-base hover:brightness-110 transition-all"
            >
              Upgrade to Premium — Start Free Trial
            </a>
            <p className="text-[10px] text-text-muted/50 text-center mt-2">3-day free trial • Cancel anytime • $9.99/week after trial</p>
          </div>
        )}

        {/* ── Sign Out ── */}
        <button onClick={handleSignOut}
          className="w-full py-3 rounded-xl border border-white/[0.08] text-text-muted hover:text-text-primary hover:border-white/[0.15] transition-colors text-sm">
          Sign Out
        </button>
      </div>
    </main>
  );
}
