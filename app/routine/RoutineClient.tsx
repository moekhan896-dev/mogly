"use client";

import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

interface RoutineClientProps {
  improvementPlan: Array<{ action?: string; why?: string } | string>;
  skinAge?: number;
  completions: Array<{ step_number: number }>;
}

export function RoutineClient({
  improvementPlan,
  skinAge,
  completions,
}: RoutineClientProps) {
  const router = useRouter();

  const completedSteps = completions.map((c) => c.step_number);

  const morningSteps = improvementPlan.slice(0, 3);
  const eveningSteps = improvementPlan.slice(3, 5);

  const handleToggle = async (stepNumber: number, isCompleting: boolean) => {
    try {
      await fetch(
        isCompleting ? "/api/routine/complete" : "/api/routine/uncomplete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepNumber }),
        }
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling routine step:", error);
    }
  };

  const allCompleted = completedSteps.length === improvementPlan.length;

  return (
    <main className="min-h-screen bg-bg-primary pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">Your Daily Routine</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Morning Routine */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            ☀️ Morning Routine
          </h2>
          <div className="space-y-3">
            {morningSteps.map((step: { action?: string; why?: string } | string, idx: number) => {
              const stepNumber = idx + 1;
              const isCompleted = completedSteps.includes(stepNumber);

              return (
                <div
                  key={stepNumber}
                  className={`rounded-lg border p-4 transition-all ${
                    isCompleted
                      ? "bg-accent-green/10 border-accent-green/30"
                      : "bg-bg-card border-white/[0.06]"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) =>
                        handleToggle(stepNumber, e.target.checked)
                      }
                      className="mt-1 w-5 h-5 rounded accent-green-500"
                    />
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          isCompleted
                            ? "text-accent-green line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {typeof step === "string"
                          ? step
                          : step.action || `Step ${stepNumber}`}
                      </p>
                      {typeof step !== "string" && step.why && (
                        <p className="text-xs text-text-muted mt-1">
                          {step.why}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-accent-green text-xl animate-pulse">
                        ✓
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evening Routine */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            🌙 Evening Routine
          </h2>
          <div className="space-y-3">
            {eveningSteps.map((step: { action?: string; why?: string } | string, idx: number) => {
              const stepNumber = idx + 4;
              const isCompleted = completedSteps.includes(stepNumber);

              return (
                <div
                  key={stepNumber}
                  className={`rounded-lg border p-4 transition-all ${
                    isCompleted
                      ? "bg-accent-green/10 border-accent-green/30"
                      : "bg-bg-card border-white/[0.06]"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) =>
                        handleToggle(stepNumber, e.target.checked)
                      }
                      className="mt-1 w-5 h-5 rounded accent-green-500"
                    />
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          isCompleted
                            ? "text-accent-green line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {typeof step === "string"
                          ? step
                          : step.action || `Step ${stepNumber}`}
                      </p>
                      {typeof step !== "string" && step.why && (
                        <p className="text-xs text-text-muted mt-1">
                          {step.why}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-accent-green text-xl animate-pulse">
                        ✓
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <div className="rounded-xl bg-gradient-to-r from-accent-green/20 to-emerald-500/20 border border-accent-green/30 p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-accent-green">
              All done for today!
            </p>
            <p className="text-xs text-text-muted mt-1">
              Great job sticking to your routine. Keep it up tomorrow!
            </p>
          </div>
        )}

        {/* Recommended Products */}
        {skinAge && (
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[2px] text-text-muted mb-3">
              Recommended Products
            </h3>
            <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4">
              <p className="text-sm text-text-muted">
                Based on your skin age ({skinAge} years) and analysis, focus on:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                <li>✦ Antioxidant-rich serums (Vitamin C, E)</li>
                <li>✦ Hydrating moisturizers (hyaluronic acid)</li>
                <li>✦ Gentle cleansers (non-stripping)</li>
                <li>✦ SPF protection (daily)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="routine" />
    </main>
  );
}
