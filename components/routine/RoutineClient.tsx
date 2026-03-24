"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { ScanResult } from "@/lib/scores";
import { linkOrphanedScans } from "@/lib/linkScans";

interface RoutineStep {
  step: number;
  action: string;
  why: string;
  impact: string;
  product?: string;
}

const DAILY_TIPS = [
  { day: 0, tip: "Rest day — your skin repairs most during deep sleep. Aim for 7-8 hours tonight." },
  { day: 1, tip: "Hydration tip: drink at least 8 glasses of water today for plumper, clearer skin." },
  { day: 2, tip: "Change your pillowcase tonight — fabric oils and bacteria build up fast and cause breakouts." },
  { day: 3, tip: "Wear SPF even on cloudy days — 80% of UV rays penetrate clouds and accelerate aging." },
  { day: 4, tip: "Avoid touching your face today — it reduces breakouts by up to 40%." },
  { day: 5, tip: "Exfoliate gently tonight — but don't overdo it. Over-exfoliation damages your skin barrier." },
  { day: 6, tip: "Progress photo day! Take a selfie and re-scan to see how your score has changed this week." },
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadCompletions(totalSteps: number): boolean[] {
  try {
    const key = `mogly_routine_${getTodayKey()}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const arr = JSON.parse(stored) as boolean[];
      if (arr.length === totalSteps) return arr;
    }
  } catch {}
  return Array(totalSteps).fill(false);
}

function saveCompletions(completions: boolean[]) {
  try {
    localStorage.setItem(`mogly_routine_${getTodayKey()}`, JSON.stringify(completions));
  } catch {}
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function RoutineClient() {
  const supabase = createClient();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [completions, setCompletions] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const todayTip = DAILY_TIPS[new Date().getDay()].tip;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      let foundScan = null;

      if (session?.user) {
        await linkOrphanedScans(supabase, session.user.id);

        const { data: scans } = await supabase
          .from("scans").select("*").eq("user_id", session.user.id)
          .order("created_at", { ascending: false }).limit(1);
        if (scans?.length) foundScan = scans[0];

        const { data: profile } = await supabase
          .from("profiles").select("subscription_status").eq("id", session.user.id).single();
        setIsPremium(profile?.subscription_status === "premium");

        const { data: streakData } = await supabase
          .from("user_streaks").select("current_streak").eq("user_id", session.user.id).single();
        if (streakData) setStreak(streakData.current_streak || 0);
      }

      if (!foundScan) {
        const lastScanId = localStorage.getItem("mogly_last_scan_id");
        if (lastScanId) {
          const { data: orphan } = await supabase.from("scans").select("*").eq("id", lastScanId).single();
          if (orphan) {
            foundScan = orphan;
            if (session?.user) {
              await supabase.from("scans").update({ user_id: session.user.id }).eq("id", lastScanId);
            }
          }
        }
      }

      if (foundScan) {
        setScan(foundScan);
        const plan = (foundScan.improvement_plan || []) as RoutineStep[];
        setCompletions(loadCompletions(plan.length));
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleToggle = (globalIdx: number) => {
    setCompletions((prev) => {
      const next = [...prev];
      next[globalIdx] = !next[globalIdx];
      saveCompletions(next);
      return next;
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm">Loading your routine...</p>
      </main>
    );
  }

  if (!scan) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6 text-center pb-24">
        <p className="text-6xl mb-5">📋</p>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Your Daily Routine</h2>
        <p className="text-text-muted mb-8 max-w-xs leading-relaxed">
          Complete your first scan to get a personalized morning and evening skincare routine
        </p>
        <a href="/scan" className="rounded-xl bg-accent-green px-8 py-3 text-black font-bold text-base">
          Take Your First Scan
        </a>
      </main>
    );
  }

  const allSteps = (scan.improvement_plan || []) as RoutineStep[];
  const morningSteps = allSteps.slice(0, 3);
  const eveningSteps = allSteps.slice(3, 5);
  const totalSteps = allSteps.length;

  // Free users see steps 1-2 (index 0-1) unlocked; 3+ blurred
  const FREE_UNLOCKED = 2;

  const completedCount = completions.filter(Boolean).length;
  const allDone = totalSteps > 0 && completedCount === totalSteps;

  const renderStep = (step: RoutineStep, globalIdx: number) => {
    const isLocked = !isPremium && globalIdx >= FREE_UNLOCKED;
    const isDone = completions[globalIdx] ?? false;

    return (
      <div
        key={step.step}
        className="rounded-xl bg-bg-card border border-white/[0.06] p-4 relative"
        style={isLocked ? { filter: "blur(3.5px)", userSelect: "none", pointerEvents: "none" } : {}}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => !isLocked && handleToggle(globalIdx)}
            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 ${
              isDone ? "border-accent-green bg-accent-green scale-110" : "border-white/20 hover:border-accent-green/50"
            }`}
          >
            {isDone && <span className="text-black font-bold text-xs">✓</span>}
          </button>
          <div className="flex-1">
            <p className={`font-semibold text-sm transition-all ${isDone ? "line-through text-text-muted" : "text-text-primary"}`}>
              {step.action}
            </p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">{step.why}</p>
            {step.impact && (
              <p className="text-xs text-accent-green mt-1.5 font-medium">→ {step.impact}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-bg-primary pb-28">
      <div className="max-w-[480px] mx-auto px-5 pt-6">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-text-muted font-mono">{formatTodayDate()}</p>
            {streak > 0 && (
              <span className="text-sm font-bold text-text-primary flex items-center gap-1">
                🔥 Day {streak}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Daily Routine</h1>
        </div>

        {/* ── Progress bar ── */}
        {totalSteps > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-muted">
                {allDone ? "✅ All done! Your skin thanks you!" : `${completedCount}/${totalSteps} completed today`}
              </p>
              <p className="text-xs font-mono text-accent-green">
                {Math.round((completedCount / totalSteps) * 100)}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-accent-green transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Morning Routine ── */}
        {morningSteps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              ☀️ Morning Routine
            </h2>
            <div className="space-y-3">
              {morningSteps.map((step, idx) => renderStep(step, idx))}
            </div>
          </section>
        )}

        {/* ── Evening Routine ── */}
        {eveningSteps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              🌙 Evening Routine
            </h2>
            <div className="space-y-3">
              {eveningSteps.map((step, idx) => renderStep(step, 3 + idx))}
            </div>
          </section>
        )}

        {/* ── Upgrade CTA for free users ── */}
        {!isPremium && totalSteps > FREE_UNLOCKED && (
          <div className="rounded-xl bg-accent-green/10 border border-accent-green/30 p-4 text-center mb-6">
            <p className="text-sm font-semibold text-text-primary mb-1">🔒 Unlock your full routine</p>
            <p className="text-xs text-text-muted mb-3">
              Steps {FREE_UNLOCKED + 1}–{totalSteps} are locked. Upgrade to Premium to see all steps.
            </p>
            <a
              href={scan ? `/results/${scan.id}` : "/scan"}
              className="inline-block rounded-lg bg-accent-green px-5 py-2 text-sm font-bold text-black"
            >
              Upgrade to Premium
            </a>
          </div>
        )}

        {/* ── Daily Tip ── */}
        <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 mb-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">💡 Today&apos;s Tip</p>
          <p className="text-sm text-text-primary leading-relaxed">{todayTip}</p>
        </div>

        {/* ── No steps fallback ── */}
        {totalSteps === 0 && (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-6 text-center">
            <p className="text-text-muted text-sm">No routine steps found. Take a new scan to generate your plan.</p>
          </div>
        )}

      </div>
    </main>
  );
}
