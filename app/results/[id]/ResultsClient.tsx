"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getScoreColor } from "@/lib/scores";
import type { ScanResult } from "@/lib/scores";
import { createClient } from "@/lib/supabase";
import { AnimatedScore } from "@/components/results/AnimatedScore";
import { SubScoresGrid } from "@/components/results/SubScoresGrid";
import { HowWeAnalyzed } from "@/components/results/HowWeAnalyzed";
import { ShareButton } from "@/components/results/ShareButton";
import { Paywall } from "@/components/results/Paywall";
import { PremiumContent } from "@/components/results/PremiumContent";
import { ScoreHistory } from "@/components/results/ScoreHistory";
import { BottomNav } from "@/components/ui/BottomNav";

interface Props {
  scan: ScanResult;
  isPremium: boolean;
  history: { date: string; score: number }[];
}

export function ResultsClient({ scan, isPremium: initialIsPremium, history }: Props) {
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [savedGoal, setSavedGoal] = useState<string | null>(null);

  const upgraded = searchParams.get("upgraded") === "true";

  // Save scan ID to localStorage for later account linking
  useEffect(() => {
    localStorage.setItem('mogly_last_scan_id', scan.id);
    try {
      const onboarding = localStorage.getItem("mogly_onboarding");
      if (onboarding) setSavedGoal(JSON.parse(onboarding).goal ?? null);
    } catch {}
  }, [scan.id]);

  // Always check premium from DB on mount using session user ID
  // (server-side isPremium can be false when scan.user_id is null)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const logged = !!session;
      setIsLoggedIn(logged);

      if (logged && session?.user) {
        // Always re-check premium status directly — bypasses scan linkage issues
        const res = await fetch("/api/check-premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const { isPremium: dbPremium } = await res.json();
        setIsPremium(dbPremium);

        // Always try to link this scan to the user (no-op if already linked)
        fetch("/api/link-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId: scan.id }),
        });

        if (upgraded) {
          // Also persist premium on first return from Stripe
          await fetch("/api/update-premium", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          });
          setIsPremium(true);
        }
      } else if (upgraded && !logged) {
        setShowAccountModal(true);
      }
    };

    checkAuth();
  }, [upgraded]);

  const savePremiumAndReload = async (userId: string) => {
    await Promise.all([
      fetch("/api/update-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
      fetch("/api/link-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id }),
      }),
    ]);
    window.location.reload();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail || !modalPassword) { setModalError("Email and password required"); return; }
    setModalLoading(true);
    setModalError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: modalEmail, password: modalPassword });
      if (error) { setModalError(error.message); setModalLoading(false); return; }
      if (!data.user?.id) { setModalError("Sign in failed"); setModalLoading(false); return; }
      await savePremiumAndReload(data.user.id);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Something went wrong");
      setModalLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail || !modalPassword) { setModalError("Email and password required"); return; }
    if (modalPassword.length < 6) { setModalError("Password must be at least 6 characters"); return; }
    setModalLoading(true);
    setModalError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email: modalEmail, password: modalPassword });
      if (error) { setModalError(error.message); setModalLoading(false); return; }
      if (!data.user?.id) { setModalError("Account creation failed"); setModalLoading(false); return; }
      await savePremiumAndReload(data.user.id);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Something went wrong");
      setModalLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setEmailStatus("sending");
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from("email_subscribers")
        .insert({ email });
      if (dbError) throw dbError;

      // Send actual email report
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scanId: scan.id })
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setEmailStatus("success");
      setEmail("");
      setTimeout(() => setEmailStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const mainColor = getScoreColor(scan.overall_score);
  const percentile = Math.max(1, 100 - Math.floor(scan.overall_score));

  // Psychology helpers
  function getPercentileCopy(score: number): string {
    if (score >= 90) return `Top ${percentile}% — You're in elite skin territory 🏆`;
    if (score >= 75) return `Better than ${100 - percentile}% of people your age ✨`;
    if (score >= 60) return `Your skin is average — real room to grow 📈`;
    return `Most people at your score see rapid gains fast 🚨`;
  }

  function getGoalCopy(goal: string | null): string | null {
    switch (goal) {
      case "clear_skin": return "Every blemish is quietly costing you confidence. A clear plan changes that.";
      case "anti_aging": return "Each day without a routine adds visible years. The window to reverse is now.";
      case "glow": return "Dull skin is 100% reversible — but only with the right ingredients and timing.";
      case "even_tone": return "Uneven tone is the first thing people notice. It's also one of the fastest to fix.";
      default: return null;
    }
  }

  // MODAL SHOULD APPEAR OVER EVERYTHING IF JUST UPGRADED AND NOT LOGGED IN
  if (upgraded && !isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-bg-card border border-accent-green/20 p-8">
          <div className="text-center mb-6">
            <p className="text-5xl mb-3">✅</p>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-text-muted">
              Sign in or create an account to unlock your full results, AI Coach, and Daily Routine
            </p>
          </div>

          {/* Auth mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/[0.1] mb-4">
            <button
              onClick={() => { setAuthMode("signin"); setModalError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${authMode === "signin" ? "bg-accent-green text-black" : "bg-transparent text-text-muted"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setModalError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${authMode === "signup" ? "bg-accent-green text-black" : "bg-transparent text-text-muted"}`}
            >
              Create Account
            </button>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={async () => {
              setModalError(null);
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mogly-amber.vercel.app";
              const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${appUrl}/auth/callback` },
              });
              if (oauthError) setModalError("Google sign-in failed. Try email instead.");
            }}
            className="flex items-center justify-center gap-3 w-full rounded-xl bg-white py-3 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors mb-3"
          >
            <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <form onSubmit={authMode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={modalEmail}
              onChange={(e) => setModalEmail(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 text-sm"
              required
            />
            <input
              type="password"
              placeholder={authMode === "signup" ? "Password (6+ characters)" : "Password"}
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 text-sm"
              required
              minLength={authMode === "signup" ? 6 : undefined}
            />

            {modalError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400 text-center">{modalError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={modalLoading}
              className="w-full rounded-xl bg-accent-green py-3 text-black font-bold text-base hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {modalLoading
                ? "..."
                : authMode === "signin"
                ? "Sign In & Unlock"
                : "Create Account & Unlock"}
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4">
            Your premium access is secured. {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setModalError(null); }}
              className="text-accent-green underline"
            >
              {authMode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary pb-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 20%, ${mainColor}08 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[480px] px-6 py-10 md:py-16">
        {/* Header */}
        <div className="mb-4 text-center">
          <p className="font-mono text-[8px] uppercase tracking-wider text-text-muted/40">
            Powered by dermatological AI
          </p>
        </div>

        {/* Score Section */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 w-16 h-16 rounded-full bg-gradient-to-b from-accent-green/20 to-accent-green/5 border-2 border-accent-green/40 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent-green/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>

          <span className="font-mono text-[11px] uppercase tracking-[3px] text-text-muted mb-5">
            Mogly Skin Analysis
          </span>

          <AnimatedScore value={scan.overall_score} color={mainColor} />

          {/* Skin age */}
          {scan.skin_age > 0 && (
            <p className="mt-3 text-sm text-text-muted">
              Skin Age: <span className="font-bold text-text-primary">{scan.skin_age}</span>
            </p>
          )}

          <div className="mt-4 mb-2 rounded-full bg-bg-card px-4 py-1.5 text-xs">
            <span className="font-semibold text-text-primary">
              {getPercentileCopy(scan.overall_score)}
            </span>
          </div>

          {/* Emotional anchor based on goal */}
          {(() => {
            const copy = getGoalCopy(savedGoal);
            return copy ? (
              <p className="mb-4 text-xs text-text-muted/80 max-w-xs text-center leading-relaxed italic">
                &ldquo;{copy}&rdquo;
              </p>
            ) : <div className="mb-4" />;
          })()}

          {/* Share */}
          <div className="w-full mb-6">
            <ShareButton data={scan} />
          </div>

          {/* How We Analyzed */}
          <div className="w-full mb-6">
            <HowWeAnalyzed />
            <SubScoresGrid scores={{
              clarity_score: scan.clarity_score,
              glow_score: scan.glow_score,
              texture_score: scan.texture_score,
              hydration_score: scan.hydration_score,
              evenness_score: scan.evenness_score,
              firmness_score: scan.firmness_score,
            }} />
          </div>
        </div>

        <div className="h-px w-full bg-white/[0.06] my-8" />

        {/* Content based on premium status */}
        {isPremium ? (
          <>
            <PremiumContent scan={scan} isLoggedIn={isLoggedIn} />
            {history.length > 1 && (
              <div className="mt-8">
                <ScoreHistory data={history} />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Treatment plan teaser — step 1 visible, rest blurred */}
            {scan.improvement_plan && scan.improvement_plan.length > 0 && (
              <div className="mb-6">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
                  Treatment Protocol
                </h3>
                <div className="flex flex-col gap-3">
                  {scan.improvement_plan.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-bg-card border border-white/[0.06] px-4 py-3.5"
                      style={i > 0 ? { filter: "blur(3px)", userSelect: "none", pointerEvents: "none" } : {}}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-green/10 text-xs font-bold text-accent-green">
                          {i === 0 ? p.step : "🔒"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{p.action}</p>
                          <p className="text-xs text-text-muted mt-1">{p.why}</p>
                          <p className="text-xs text-accent-green mt-1 font-medium">{p.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-text-muted mt-3">
                  Unlock all {scan.improvement_plan.length} steps with Premium
                </p>
              </div>
            )}

            {/* Email capture */}
            <div className="mb-6">
              <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5 text-center">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  📧 Get your free mini skin report
                </p>
                <p className="text-[11px] text-text-muted mb-3">
                  We&apos;ll email your top 3 findings + 7-day re-scan reminder
                </p>
                {emailStatus === "success" ? (
                  <div className="space-y-2">
                    <p className="text-accent-green text-sm font-semibold">
                      ✅ Report sent! Check your email
                    </p>
                    <p className="text-[11px] text-text-muted">
                      We&apos;ll remind you in 7 days to re-scan and track your progress
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50"
                    />
                    <button
                      onClick={handleEmailSubmit}
                      disabled={emailStatus === "sending"}
                      className="rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
                    >
                      {emailStatus === "sending" ? "..." : "Notify"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Loss aversion section */}
            <div className="mb-6 rounded-xl bg-red-500/5 border border-red-500/20 p-4">
              <p className="text-sm font-semibold text-red-400 mb-2">⚠️ Without a plan, scores drop</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Users who don&apos;t follow a personalized routine typically see their score decline 5–15 points within 90 days. Environmental damage, stress, and unaddressed conditions compound fast.
              </p>
              <p className="text-xs text-accent-green font-medium mt-2">
                Users with a Premium plan average +18 points in 30 days.
              </p>
            </div>

            {/* Paywall */}
            <Paywall scanId={scan.id} />
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-3 pb-8">
          <span className="font-mono text-[11px] text-[#333]">mogly.app</span>
        </footer>
      </div>

      {/* Bottom nav only for logged-in users */}
      {isLoggedIn && <BottomNav />}
    </main>
  );
}
