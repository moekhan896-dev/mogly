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
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  
  const upgraded = searchParams.get("upgraded") === "true";

  // Check if user is logged in and should show modal
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const logged = !!session;
      setIsLoggedIn(logged);

      // If upgraded=true and NOT logged in, show modal
      if (upgraded && !logged) {
        setShowAccountModal(true);
      }
    };

    checkAuth();
  }, [upgraded]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalEmail || !modalPassword) {
      setModalError("Email and password required");
      return;
    }
    if (modalPassword.length < 6) {
      setModalError("Password must be at least 6 characters");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: modalEmail,
        password: modalPassword,
      });

      if (signUpError) {
        setModalError(signUpError.message);
        setModalLoading(false);
        return;
      }

      if (!signUpData.user?.id) {
        setModalError("Account creation failed");
        setModalLoading(false);
        return;
      }

      // Link scan to user
      const { error: scanError } = await supabase
        .from("scans")
        .update({ user_id: signUpData.user.id })
        .eq("id", scan.id);

      if (scanError) {
        console.warn("Could not link scan:", scanError);
      }

      // Mark as premium
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: signUpData.user.id,
          subscription_status: "premium",
        }, { onConflict: "user_id" });

      if (profileError) {
        console.warn("Could not update profile:", profileError);
      }

      // Account created successfully - hide modal and show premium content
      setShowAccountModal(false);
      setIsLoggedIn(true);
      setIsPremium(true);
      setModalLoading(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Something went wrong");
      setModalLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setEmailStatus("sending");
    try {
      const { error } = await supabase
        .from("email_subscribers")
        .insert({ email });
      if (error) throw error;
      setEmailStatus("success");
      setEmail("");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const mainColor = getScoreColor(scan.overall_score);
  const percentile = Math.max(1, 100 - Math.floor(scan.overall_score));

  // MODAL SHOULD APPEAR OVER EVERYTHING IF JUST UPGRADED AND NOT LOGGED IN
  if (upgraded && !isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-bg-card border border-accent-green/20 p-8">
          <div className="text-center mb-8">
            <p className="text-5xl mb-3">✅</p>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-text-muted">
              Create your account to unlock your full results, AI Coach, Daily Routine, and exclusive insights
            </p>
          </div>

          <form onSubmit={handleAccountSubmit} className="space-y-3 mb-4">
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
              placeholder="Password (6+ characters)"
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 text-sm"
              required
              minLength={6}
            />

            {modalError && (
              <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-3 py-2">
                <p className="text-xs text-accent-red text-center">{modalError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={modalLoading}
              className="w-full rounded-xl bg-accent-green py-3 text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {modalLoading ? "Creating..." : "Create Account & View Results"}
            </button>
          </form>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.1]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-card text-text-muted">or</span>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (error) setModalError(error.message);
              } catch (err) {
                setModalError('Google sign-in failed');
              }
            }}
            className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] py-3 text-white font-semibold hover:bg-white/[0.1] transition-all mb-3"
          >
            Sign in with Google
          </button>

          <p className="text-xs text-text-muted text-center">
            Your premium access is secured. Create an account to unlock everything.
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

          <div className="mt-4 mb-6 rounded-full bg-bg-card px-4 py-1.5 text-xs">
            <span className="font-semibold text-text-primary">
              {scan.overall_score >= 90 
                ? `Top ${percentile}% — Exceptional skin 🔥` 
                : scan.overall_score >= 75 
                ? `Top ${percentile}% — Better than most ✨` 
                : `Needs attention 🚨`}
            </span>
          </div>

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
