"use client";

import { getSeverityColor } from "@/lib/scores";
import type { ScanResult } from "@/lib/scores";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  scan: ScanResult;
  isLoggedIn?: boolean;
}

export function PremiumContent({ scan, isLoggedIn = true }: Props) {
  const router = useRouter();
  const [reminderSet, setReminderSet] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetReminder = async () => {
    if (!reminderEmail) return;
    setLoading(true);
    try {
      // Save subscription
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reminderEmail, scanId: scan.id }),
      });
      
      // Also send the report email
      if (res.ok) {
        await fetch("/api/send-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: reminderEmail, scanId: scan.id }),
        });
        
        setReminderSet(true);
        setReminderEmail("");
      }
    } catch (err) {
      console.error("Reminder error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
      {/* ── Conditions ── */}
      {scan.conditions && scan.conditions.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
            Conditions Detected
          </h3>
          <div className="flex flex-col gap-3">
            {scan.conditions.map((c, i) => (
              <div
                key={i}
                className="rounded-xl bg-bg-card border border-white/[0.06] px-4 py-3.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-text-primary">
                    {c.name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: `${getSeverityColor(c.severity)}20`,
                      color: getSeverityColor(c.severity),
                    }}
                  >
                    {c.severity}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  <span className="text-text-primary/70">{c.area}</span> — {c.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Fix Plan ── */}
      {scan.improvement_plan && scan.improvement_plan.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
            Your Fix Plan
          </h3>
          <div className="flex flex-col gap-3">
            {scan.improvement_plan.map((p, i) => (
              <div
                key={i}
                className="rounded-xl bg-bg-card border border-white/[0.06] px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-green/10 text-xs font-bold text-accent-green">
                    {p.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {p.action}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{p.why}</p>
                    <p className="text-xs text-accent-green mt-1 font-medium">
                      {p.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Product Recs ── */}
      {scan.product_recs && scan.product_recs.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
            Recommended Products
          </h3>
          <div className="flex flex-col gap-3">
            {scan.product_recs.map((p, i) => (
              <div
                key={i}
                className="rounded-xl bg-bg-card border border-white/[0.06] px-4 py-3.5 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {p.product}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {p.brand} • {p.price_range}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{p.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Dietary Triggers ── */}
      {scan.dietary_triggers && scan.dietary_triggers.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
            Dietary Triggers
          </h3>
          <div className="flex flex-col gap-3">
            {scan.dietary_triggers.map((d, i) => (
              <div
                key={i}
                className="rounded-xl bg-bg-card border border-white/[0.06] px-4 py-3.5"
              >
                <p className="text-sm font-semibold text-text-primary">
                  {d.trigger}
                </p>
                <p className="text-xs text-text-muted mt-1">{d.impact}</p>
                <p className="text-xs text-accent-green mt-1 font-medium">
                  → {d.recommendation}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted text-center italic">
            Start tracking your food to see how it affects your score
          </p>
        </section>
      )}

      {/* ── Re-scan Prompt ── */}
      <div className="rounded-xl bg-bg-card border border-accent-green/20 p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">📈</span>
          <div>
            <p className="font-semibold text-text-primary">Track Your Progress</p>
            <p className="text-xs text-text-muted mt-1">
              Scan again in 7 days to see how your score changed
            </p>
          </div>
        </div>
        
        {reminderSet ? (
          <p className="text-xs text-accent-green font-medium">✅ Reminder set! Check your email</p>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={reminderEmail}
              onChange={(e) => setReminderEmail(e.target.value)}
              className="flex-1 rounded-lg bg-bg-primary px-3 py-2 text-sm border border-white/[0.06] placeholder:text-text-muted focus:outline-none focus:border-accent-green/40 disabled:opacity-50"
              disabled={loading}
            />
            <button
              onClick={handleSetReminder}
              disabled={loading || !reminderEmail}
              className="rounded-lg bg-accent-green/10 border border-accent-green/30 px-4 py-2 text-sm font-semibold text-accent-green hover:bg-accent-green/20 disabled:opacity-50 transition-all"
            >
              {loading ? "..." : "Remind"}
            </button>
          </div>
        )}
        
        <a
          href="/scan/capture"
          className="block mt-3 text-center text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          or Scan Again Now →
        </a>
      </div>

      {/* Quick action buttons */}
      <div className="mt-8 flex flex-col gap-3 pt-8 border-t border-white/[0.06]">
        {isLoggedIn ? (
          <>
            <a
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-gold/10 border border-accent-gold/30 py-3 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20"
            >
              📋 Your Daily Routine
            </a>
            <a
              href="/coach"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/30 py-3 text-sm font-semibold text-accent-green transition-colors hover:bg-accent-green/20"
            >
              💬 Ask Your Coach
            </a>
          </>
        ) : (
          <>
            <button
              onClick={() => document.getElementById("account-creation")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-gold/10 border border-accent-gold/30 py-3 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/20"
            >
              📋 Your Daily Routine
            </button>
            <button
              onClick={() => document.getElementById("account-creation")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/30 py-3 text-sm font-semibold text-accent-green transition-colors hover:bg-accent-green/20"
            >
              💬 Ask Your Coach
            </button>
          </>
        )}
      </div>
    </div>
  );
}
