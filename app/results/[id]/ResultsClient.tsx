"use client";

import { getScoreColor } from "@/lib/scores";
import type { ScanResult } from "@/lib/scores";
import { AnimatedScore } from "@/components/results/AnimatedScore";
import { SubScoresGrid } from "@/components/results/SubScoresGrid";
import { ShareButton } from "@/components/results/ShareButton";
import { Paywall } from "@/components/results/Paywall";
import { PremiumContent } from "@/components/results/PremiumContent";
import { ScoreHistory } from "@/components/results/ScoreHistory";

interface Props {
  scan: ScanResult;
  isPremium: boolean;
  history: { date: string; score: number }[];
  justUpgraded?: boolean;
}

export function ResultsClient({ scan, isPremium, history, justUpgraded }: Props) {
  const mainColor = getScoreColor(scan.overall_score);
  
  // FIX BUG 2: Calculate percentile as 100 - score
  const percentile = Math.max(1, 100 - Math.floor(scan.overall_score));

  const scores = {
    clarity_score: scan.clarity_score,
    glow_score: scan.glow_score,
    texture_score: scan.texture_score,
    hydration_score: scan.hydration_score,
    evenness_score: scan.evenness_score,
    firmness_score: scan.firmness_score,
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
        {/* Upgrade success banner */}
        {justUpgraded && isPremium && (
          <div className="mb-6 rounded-xl bg-accent-green/10 border border-accent-green/20 px-5 py-3 text-center animate-fade-up">
            <p className="text-sm font-semibold text-accent-green">
              🎉 Welcome to Mogly Premium! Your full report is unlocked.
            </p>
          </div>
        )}
        {/* ══════════════════════════════════════ */}
        {/*  FREE SECTION — Scores                */}
        {/* ══════════════════════════════════════ */}
        <div className="flex flex-col items-center text-center">
          {/* Label */}
          <span
            className="font-mono text-[11px] uppercase tracking-[3px] text-text-muted mb-5 animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            Mogly Score
          </span>

          {/* Big score */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <AnimatedScore value={scan.overall_score} color={mainColor} />
          </div>

          {/* Percentile badge */}
          <div
            className="mt-4 mb-8 rounded-full bg-bg-card px-4 py-1.5 text-xs text-text-muted animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Top <span className="font-semibold text-text-primary">{percentile}%</span> of users
          </div>

          {/* Sub-scores grid */}
          <div className="w-full mb-8">
            <SubScoresGrid scores={scores} />
          </div>

          {/* Score Killer */}
          {scan.score_killer && (
            <div
              className="w-full animate-fade-up"
              style={{ animationDelay: "800ms" }}
            >
              <div className="h-px w-full bg-white/[0.06] mb-6" />
              <div className="rounded-xl bg-bg-card border border-accent-red/20 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⚠️</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-red">
                    Your #1 Score Killer
                  </span>
                </div>
                <p className="text-sm text-accent-red/90 leading-relaxed mb-3">
                  {scan.score_killer}
                </p>
                <p className="text-sm text-amber-400 mb-2">
                  We detected {scan.conditions?.length || 1} skin concern{scan.conditions?.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-text-muted">
                  See what's holding your score back →
                </p>
              </div>
            </div>
          )}

          {/* Share button */}
          <div
            className="w-full mt-6 animate-fade-up"
            style={{ animationDelay: "900ms" }}
          >
            <ShareButton data={scan} />
          </div>
        </div>

        {/* ══════════════════════════════════════ */}
        {/*  TEASER SECTIONS                       */}
        {/* ══════════════════════════════════════ */}

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-bg-card p-5">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">WHAT WE FOUND</p>
            <div className="blur-sm select-none pointer-events-none">
              <div className="rounded-lg bg-white/[0.03] p-3 mb-2">
                <span className="text-accent-red text-sm">Moderate</span>
                <span className="text-white text-sm"> — Inflammatory concerns detected in T-zone region</span>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 mb-2">
                <span className="text-amber-400 text-sm">Mild</span>
                <span className="text-white text-sm"> — Dehydration patterns visible on cheeks</span>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <span className="text-amber-400 text-sm">Mild</span>
                <span className="text-white text-sm"> — Uneven texture in forehead area</span>
              </div>
            </div>
            <p className="text-center mt-3 text-accent-gold text-[13px]">🔒 Unlock to see your full diagnosis</p>
          </div>

          <div className="rounded-xl bg-bg-card p-5">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">YOUR 5-STEP FIX PLAN</p>
            <div className="blur-sm select-none pointer-events-none">
              <div className="rounded-lg bg-white/[0.03] p-2.5 mb-1.5 text-white text-sm">Step 1: Switch to a gentle sulfate-free cleanser twice daily</div>
            </div>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 2: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 3: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 4: Locked</p>
            <p className="p-2.5 text-text-muted text-[13px]">🔒 Step 5: Locked</p>
          </div>

          <div className="rounded-xl bg-bg-card p-5 text-center">
            <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-3">YOUR SCORE VS AVERAGE</p>
            <p className="text-white text-base mb-1">You: <span className="text-2xl font-bold">{scan.overall_score}</span> | Average: <span className="text-2xl font-bold">62</span></p>
            <p className={`text-[13px] ${scan.overall_score >= 62 ? 'text-accent-green' : 'text-amber-400'}`}>
              {scan.overall_score >= 62
                ? "You're above average — unlock your plan to reach 85+"
                : "Your fix plan can improve your score by 15-20 points in 30 days"}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════ */}
        {/*  Divider                               */}
        {/* ══════════════════════════════════════ */}
        <div className="h-px w-full bg-white/[0.06] my-8" />

        {/* ══════════════════════════════════════ */}
        {/*  PAYWALL or PREMIUM                    */}
        {/* ══════════════════════════════════════ */}
        {isPremium ? (
          <>
            <PremiumContent scan={scan} />
            {history.length > 1 && (
              <div className="mt-8">
                <ScoreHistory data={history} />
              </div>
            )}
          </>
        ) : (
          <Paywall scanId={scan.id} />
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
