"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { ScanResult } from "@/lib/scores";

interface RoutineStep {
  step: number;
  action: string;
  why: string;
  impact: string;
  product?: string;
}

export function RoutineClient() {
  const router = useRouter();
  const supabase = createClient();
  
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [completions, setCompletions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      setUser(session?.user || null);

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Fetch user's latest scan
      const { data: scans } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        setScan(scans[0]);

        // Fetch today's completions
        const { data } = await supabase
          .from("routine_completions")
          .select("step_number")
          .eq("user_id", session.user.id)
          .eq("completed_date", todayDate);

        if (data) {
          setCompletions(data.map((d) => d.step_number));
        }
      }

      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleToggle = async (stepNum: number) => {
    if (!user) return;

    const isCompleted = completions.includes(stepNum);

    try {
      if (isCompleted) {
        // Remove completion
        await supabase
          .from("routine_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("step_number", stepNum)
          .eq("completed_date", todayDate);

        setCompletions((prev) => prev.filter((s) => s !== stepNum));
      } else {
        // Add completion
        await supabase.from("routine_completions").insert({
          user_id: user.id,
          step_number: stepNum,
          completed_date: todayDate,
        });

        setCompletions((prev) => [...prev, stepNum]);
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading your routine...</p>
      </main>
    );
  }

  if (!user || !scan) {
    return (
      <main className="flex flex-col min-h-screen bg-bg-primary pb-24">
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <p className="text-6xl mb-6">📋</p>
          <h2 className="text-3xl font-bold text-text-primary mb-3">Your Daily Routine</h2>
          <p className="text-base text-text-muted mb-8 max-w-sm leading-relaxed">
            Complete your first scan to get a personalized morning and evening skincare routine.
          </p>
          <a
            href="/scan"
            className="inline-block rounded-xl bg-accent-green px-8 py-3 text-black font-semibold hover:brightness-110 transition-all"
          >
            Take Your First Scan
          </a>
        </div>
      </main>
    );
  }

  const morningSteps = (scan.improvement_plan || []).slice(0, 3) as RoutineStep[];
  const eveningSteps = (scan.improvement_plan || []).slice(3, 5) as RoutineStep[];
  const totalSteps = morningSteps.length + eveningSteps.length;
  const completedCount = completions.length;
  const allDone = totalSteps > 0 && completedCount === totalSteps;

  return (
    <main className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Your Daily Routine 📋
          </h1>
          <p className="text-sm text-text-muted">
            {completedCount}/{totalSteps} completed {completedCount === totalSteps && totalSteps > 0 ? "✨" : ""}
          </p>
        </div>

        {/* Progress Bar */}
        {totalSteps > 0 && (
          <div className="mb-8 rounded-full bg-white/[0.06] h-2 overflow-hidden">
            <div
              className="h-full bg-accent-green transition-all"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* Morning Routine */}
        {morningSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              ☀️ Morning Routine
            </h2>
            <div className="space-y-4">
              {morningSteps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-xl bg-bg-card border border-white/[0.06] p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(step.step)}
                      className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                        completions.includes(step.step)
                          ? "border-accent-green bg-accent-green"
                          : "border-white/[0.2]"
                      }`}
                    >
                      {completions.includes(step.step) && (
                        <span className="text-black font-bold text-sm">✓</span>
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`font-semibold transition-all ${
                          completions.includes(step.step)
                            ? "text-text-muted line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {step.action}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{step.why}</p>
                      <p className="text-xs text-accent-green mt-2 font-medium">
                        → {step.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Evening Routine */}
        {eveningSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              🌙 Evening Routine
            </h2>
            <div className="space-y-4">
              {eveningSteps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-xl bg-bg-card border border-white/[0.06] p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(step.step)}
                      className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                        completions.includes(step.step)
                          ? "border-accent-green bg-accent-green"
                          : "border-white/[0.2]"
                      }`}
                    >
                      {completions.includes(step.step) && (
                        <span className="text-black font-bold text-sm">✓</span>
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`font-semibold transition-all ${
                          completions.includes(step.step)
                            ? "text-text-muted line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {step.action}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{step.why}</p>
                      <p className="text-xs text-accent-green mt-2 font-medium">
                        → {step.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completion Message */}
        {allDone && (
          <div className="rounded-xl bg-accent-green/10 border border-accent-green/20 p-6 text-center mt-12">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-lg font-bold text-accent-green mb-2">
              All done for today!
            </p>
            <p className="text-sm text-text-muted">
              Come back tomorrow to continue your routine
            </p>
          </div>
        )}

        {totalSteps === 0 && (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-6 text-center">
            <p className="text-text-muted">
              No routine steps available. Take a new scan to get personalized steps.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
