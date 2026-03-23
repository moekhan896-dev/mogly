"use client";

import { useState } from "react";
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

interface Props {
  scan: ScanResult;
  isPremium: boolean;
  history: { date: string; score: number }[];
  justUpgraded?: boolean;
  streak?: number | null;
}

export function ResultsClient({ scan, isPremium, history, justUpgraded, streak }: Props) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const mainColor = getScoreColor(scan.overall_score);
  
  // FIX BUG 2: Calculate percentile as 100 - score
  const percentile = Math.max(1, 100 - Math.floor(scan.overall_score));

  // Calculate previous score for comparison
  const previousScore = history.length >= 2 ? history[history.length - 2].score : null;
  const scoreDiff = previousScore ? scan.overall_score - previousScore : null;

  const scores = {
    clarity_score: scan.clarity_score,
    glow_score: scan.glow_score,
    texture_score: scan.texture_score,
    hydration_score: scan.hydration_score,
    evenness_score: scan.evenness_score,
    firmness_score: scan.firmness_score,
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setEmailStatus("sending");
    try {
      const supabase = createClient();
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

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 20%, ${mainColor}08 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[480px] px-6 py-10 md:py-16">
        {/* C7: Powered by dermatological AI badge */}
        <div className="mb-4 text-center">
          <p className="font-mono text-[8px] uppercase tracking-wider text-text-muted/40">
            Powered by dermatological AI
          </p>
        </div>

        {/* Upgrade success banner */}
        {justUpgraded && isPremium && (
          <div className="mb-6 rounded-xl bg-accent-green/10 border border-accent-green/20 px-5 py-3 text-center animate-fade-up">
            <p className="text-sm font-semibold text-accent-green">
              🎉 Welcome to Mogly Premium! Your full report is unlocked.
            </p>
          </div>
        )}

        {/* Daily Streak */}
        {streak && streak > 0 && (
          <div className="mb-6 rounded-xl bg-orange-500/10 border border-orange-500/20 px-5 py-3 text-center animate-fade-up">
            <p className="text-sm font-semibold text-orange-400">
              🔥 {streak} day streak — Keep it up!
            </p>
          </div>
        )}
        {/* ══════════════════════════════════════ */}
        {/*  FREE SECTION — Scores                */}
        {/* ══════════════════════════════════════ */}
        <div className="flex flex-col items-center text-center">
          {/* Face silhouette avatar */}
          <div
            className="mb-5 w-16 h-16 rounded-full bg-gradient-to-b from-accent-green/20 to-accent-green/5 border-2 border-accent-green/40 flex items-center justify-center animate-fade-up"
            style={{ animationDelay: "-100ms" }}
          >
            <svg
              className="w-8 h-8 text-accent-green/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>

          {/* Label */}
          <span
            className="font-mono text-[11px] uppercase tracking-[3px] text-text-muted mb-5 animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            Mogly Skin Analysis
          </span>

          {/* Big score */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <AnimatedScore value={scan.overall_score} color={mainColor} />
          </div>

          {/* Score Comparison (for returning users) */}
          {isPremium && previousScore !== null && scoreDiff !== null && (
            <div
              className={`mb-6 rounded-xl px-5 py-3 text-center animate-fade-up ${
                scoreDiff > 0
                  ? "bg-accent-green/10 border border-accent-green/20"
                  : scoreDiff < 0
                  ? "bg-amber-400/10 border border-amber-400/20"
                  : "bg-white/[0.02] border border-white/[0.06]"
              }`}
              style={{ animationDelay: "240ms" }}
            >
              <p className={`text-sm font-semibold ${
                scoreDiff > 0
                  ? "text-accent-green"
                  : scoreDiff < 0
                  ? "text-amber-400"
                  : "text-text-muted"
              }`}>
                {previousScore} → {scan.overall_score}
                {scoreDiff > 0 && ` (+${scoreDiff} points! 🎉)`}
                {scoreDiff < 0 && ` (${scoreDiff} points)`}
                {scoreDiff === 0 && " (no change)"}
              </p>
            </div>
          )}

          {/* Percentile badge - Smart Language */}
          <div
            className="mt-4 mb-4 rounded-full bg-bg-card px-4 py-1.5 text-xs text-text-muted animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <span className="font-semibold text-text-primary">
              {scan.overall_score >= 90 
                ? `Top ${percentile}% — Exceptional skin 🔥` 
                : scan.overall_score >= 75 
                ? `Top ${percentile}% — Better than most ✨` 
                : scan.overall_score >= 60 
                ? `Top ${percentile}% — Room to improve 📈` 
                : scan.overall_score >= 40 
                ? `Bottom half — Your plan can fix this 💪` 
                : `Needs attention — Start your fix plan today 🚨`}
            </span>
          </div>

          {/* Skin Age Badge */}
          <div
            className="mb-6 rounded-full bg-bg-card px-4 py-1.5 text-xs text-text-muted animate-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            <span className="font-semibold text-text-primary">
              Skin Age: <span className="text-accent-gold">{scan.skin_age || "—"}</span>
            </span>
            {scan.skin_age !== undefined && (
              <>
                <br />
                {scan.skin_age < 20 ? (
                  <span className="text-accent-green text-[11px]">Your skin looks 3+ years younger ✨</span>
                ) : scan.skin_age > 30 ? (
                  <span className="text-amber-400 text-[11px]">Your skin is aging faster than expected</span>
                ) : (
                  <span className="text-text-muted text-[11px]">Within average range for your age</span>
                )}
              </>
            )}
          </div>

          {/* Score-Dependent Emotional Message */}
          <div
            className="mb-6 rounded-xl bg-white/[0.02] border border-white/[0.06] px-5 py-3 text-center animate-fade-up"
            style={{ animationDelay: "250ms" }}
          >
            {scan.overall_score >= 85 ? (
              <p className="text-sm text-accent-green">
                Your skin is in excellent shape — share and flex 💪
              </p>
            ) : scan.overall_score >= 60 ? (
              <p className="text-sm text-amber-400">
                Good foundation — your plan can push you to 85+
              </p>
            ) : (
              <p className="text-sm text-orange-400">
                Users who follow their plan improve 15-20 points in 30 days
              </p>
            )}
          </div>

          {/* ⭐ SHARE & CHALLENGE BUTTONS - HIGH UP FOR VIRALITY ⭐ */}
          <div
            className="w-full mb-6 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <ShareButton data={scan} />
          </div>

          <div
            className="w-full mb-8 animate-fade-up"
            style={{ animationDelay: "350ms" }}
          >
            <button
              onClick={() => {
                const text = `I got a ${scan.overall_score} on my Mogly Skin Analysis. Think you can beat me? Try it free → mogly.app`;
                if (navigator.share) {
                  navigator.share({
                    text,
                    title: "Challenge me on Mogly",
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    alert("Challenge copied! Share it however you like.");
                  });
                }
              }}
              className="w-full rounded-xl bg-bg-card border border-white/[0.06] hover:border-white/10 px-5 py-3 text-sm text-text-muted text-center transition-all"
            >
              🎯 Challenge a friend — dare them to beat your score
            </button>
          </div>

          {/* How We Analyzed You */}
          <div className="w-full mb-6">
            <div
              className="mb-6 animate-fade-up"
              style={{ animationDelay: "450ms" }}
            >
              <HowWeAnalyzed />
            </div>
            <SubScoresGrid scores={scores} />
          </div>

          {/* Score Killer - Enhanced */}
          {scan.score_killer && (
            <div
              className="w-full animate-fade-up"
              style={{ animationDelay: "850ms" }}
            >
              <div className="h-px w-full bg-white/[0.06] mb-6" />
              <div className="rounded-xl bg-bg-card border border-accent-red/20 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⚠️</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-red">
                    Primary Concern Detected
                  </span>
                </div>
                <p className="text-sm text-accent-red/90 leading-relaxed mb-3">
                  {scan.score_killer}
                </p>
                <p className="text-sm text-amber-400 mb-2">
                  We detected {scan.conditions?.length || 1} skin concern{scan.conditions?.length !== 1 ? 's' : ''} affecting your score.
                </p>
                <p className="text-xs text-text-muted">
                  Your personalized fix plan is ready →
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════ */}
        {/*  PERSONALIZED TEASER SECTIONS (FREE ONLY) */}
        {/* ══════════════════════════════════════ */}
        {!(isPremium || justUpgraded) && (
        <div className="mt-6 space-y-4">
          {/* WHAT WE FOUND - Real conditions */}
          <div className="rounded-xl bg-bg-card p-5">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">Diagnostic Findings</p>
            {/* C1: Condition count */}
            <p className="text-xs text-text-muted mb-3">
              We detected {scan.conditions?.length || 0} condition{scan.conditions?.length !== 1 ? "s" : ""} — unlock to see details
            </p>
            <div className="blur-sm select-none pointer-events-none space-y-2">
              {scan.conditions?.slice(0, 3).map((cond: { severity: string; name: string; area?: string }, idx: number) => {
                const severityColor = 
                  cond.severity === 'severe' ? 'text-red-500' :
                  cond.severity === 'moderate' ? 'text-orange-500' :
                  'text-amber-400';
                return (
                  <div key={idx} className="rounded-lg bg-white/[0.03] p-3">
                    <span className={`${severityColor} text-sm font-semibold capitalize`}>{cond.severity}</span>
                    <span className="text-white text-sm ml-2">— {cond.name} {cond.area && `in ${cond.area}`}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => document.getElementById("paywall")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full text-center mt-3 rounded-lg bg-accent-gold/10 border border-accent-gold/30 py-2 px-3 text-accent-gold text-[13px] hover:bg-accent-gold/20 transition-all"
            >
              🔒 Unlock to see your full diagnosis
            </button>
          </div>

          {/* YOUR FIX PLAN - Real step 1 VISIBLE, steps 2-5 locked */}
          <div className="rounded-xl bg-bg-card p-5">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">Treatment Protocol</p>
            
            {/* Step 1 - VISIBLE with green left border (C2) */}
            {scan.improvement_plan?.[0] && (
              <div className="rounded-lg bg-white/[0.03] p-2.5 mb-3 border border-accent-green/20 border-l-2 border-l-accent-green pl-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-green/20 text-xs font-bold text-accent-green flex-shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{scan.improvement_plan[0].action}</p>
                    <p className="text-xs text-text-muted mt-1">{scan.improvement_plan[0].why}</p>
                    <p className="text-xs text-accent-green mt-1 font-medium">{scan.improvement_plan[0].impact}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Steps 2-5 - LOCKED */}
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 2: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 3: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 4: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 5: Locked</p>
          </div>

          {/* YOUR SCORE VS AVERAGE */}
          <div className="rounded-xl bg-bg-card p-5 text-center">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-2">
              We found {scan.conditions?.length || 0} conditions affecting your score
            </p>
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">Comparative Analysis</p>
            <p className="text-white text-base mb-1">You: <span className="text-2xl font-bold">{scan.overall_score}</span> | Average: <span className="text-2xl font-bold">62</span></p>
            <p className={`text-[13px] ${scan.overall_score >= 62 ? 'text-accent-green' : 'text-amber-400'}`}>
              {scan.overall_score >= 62
                ? "You're above average — unlock your plan to reach 85+"
                : "Your fix plan can improve your score by 15-20 points in 30 days"}
            </p>
          </div>
        </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/*  Divider                               */}
        {/* ══════════════════════════════════════ */}
        <div className="h-px w-full bg-white/[0.06] my-8" />

        {/* ══════════════════════════════════════ */}
        {/*  PAYWALL or PREMIUM                    */}
        {/* ══════════════════════════════════════ */}
        {isPremium || justUpgraded ? (
          <>
            <PremiumContent scan={scan} />
            {history.length > 1 && (
              <div className="mt-8">
                <ScoreHistory data={history} />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 animate-fade-up" style={{ animationDelay: "1300ms" }}>
              <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5 text-center">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  📧 Get your free mini skin report
                </p>
                <p className="text-[11px] text-text-muted mb-3">
                  We&apos;ll email your top 3 findings + 7-day re-scan reminder
                </p>
                {emailStatus === "success" ? (
                  <p className="text-accent-green text-sm font-semibold">
                    ✅ You&apos;re on the list!
                  </p>
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
                      className="rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {emailStatus === "sending" ? "..." : emailStatus === "error" ? "Retry" : "Notify"}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div id="paywall">
              <Paywall scanId={scan.id} />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════ */}
        {/*  Footer                                */}
        {/* ══════════════════════════════════════ */}
        <footer className="mt-12 flex flex-col items-center gap-3 pb-8">
          <span className="font-mono text-[11px] text-[#333]">mogly.app</span>
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <a href="/privacy" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </a>
            <span className="text-white/10">|</span>
            <a href="/terms" className="hover:text-text-primary transition-colors">
              Terms
            </a>
            <span className="text-white/10">|</span>
            <a href="mailto:hello@mogly.app" className="hover:text-text-primary transition-colors">
              Contact
            </a>
          </div>
          <p className="text-[9px] text-text-muted/60 text-center max-w-xs leading-relaxed">
            Mogly provides AI-powered insights for informational purposes only.
            Not a medical diagnosis. Consult a dermatologist for persistent skin concerns.
          </p>
        </footer>
      </div>
    </main>
  );
}
