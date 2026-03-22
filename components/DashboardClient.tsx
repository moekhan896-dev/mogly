"use client";

import { useState, useEffect } from "react";
import type { ScanResult } from "@/lib/scores";

interface DashboardProps {
  scan: ScanResult;
  isPremium: boolean;
}

export function DashboardClient({ scan, isPremium }: DashboardProps) {
  const [completed, setCompleted] = useState<boolean[]>(
    Array(scan.improvement_plan?.length || 0).fill(false)
  );

  // Load from localStorage on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `mogly-routine-${scan.id}-${today}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setCompleted(JSON.parse(saved));
    } else {
      // Reset for new day
      setCompleted(Array(scan.improvement_plan?.length || 0).fill(false));
    }
  }, [scan.id]);

  // Save to localStorage when completed changes
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `mogly-routine-${scan.id}-${today}`;
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, scan.id]);

  const toggleStep = (index: number) => {
    const newCompleted = [...completed];
    newCompleted[index] = !newCompleted[index];
    setCompleted(newCompleted);
  };

  const completedCount = completed.filter(Boolean).length;
  const totalSteps = scan.improvement_plan?.length || 0;

  if (!isPremium) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="text-center px-6">
          <p className="text-xl font-semibold text-text-primary mb-2">Premium Only</p>
          <p className="text-text-muted">Subscribe to access your daily routine</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="relative z-10 mx-auto max-w-[480px] px-6 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Your Daily Routine</h1>
          <p className="text-sm text-text-muted">Keep your streak alive</p>
        </div>

        {/* Current Score Card */}
        <div className="mb-8 rounded-xl bg-bg-card border border-white/[0.06] p-5 text-center">
          <p className="text-xs text-text-muted mb-2">Current Score</p>
          <p className="text-4xl font-bold text-accent-gold">{scan.overall_score}</p>
          <p className="text-xs text-text-muted mt-2">Target: 85+</p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl bg-bg-card border border-white/[0.06] p-5">
          <p className="text-sm font-semibold text-text-primary mb-3">
            {completedCount}/{totalSteps} steps completed today ✨
          </p>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-300"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {scan.improvement_plan?.map((step, index) => (
            <button
              key={index}
              onClick={() => toggleStep(index)}
              className="w-full text-left rounded-xl bg-bg-card border border-white/[0.06] hover:border-white/10 p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                    completed[index]
                      ? "border-accent-green bg-accent-green"
                      : "border-white/20"
                  }`}
                >
                  {completed[index] && (
                    <span className="text-xs font-bold text-black">✓</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      completed[index] ? "text-text-muted line-through" : "text-text-primary"
                    }`}
                  >
                    {step.action}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{step.why}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Motivational message */}
        {completedCount === totalSteps && (
          <div className="mt-8 rounded-xl bg-accent-green/10 border border-accent-green/20 p-5 text-center animate-fade-up">
            <p className="text-sm font-semibold text-accent-green">
              🎉 Great job! You completed your routine today.
            </p>
            <p className="text-xs text-text-muted mt-2">
              Keep this up — users who follow their routine improve 15-20 points in 30 days.
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-12 flex gap-3 text-center text-xs text-text-muted">
          <a href="/" className="hover:text-text-primary transition-colors">
            ← Back to Scan
          </a>
          <span>•</span>
          <a href="/coach" className="hover:text-text-primary transition-colors">
            Ask Coach →
          </a>
        </div>
      </div>
    </main>
  );
}
