"use client";

import { getSeverityColor } from "@/lib/scores";
import type { ScanResult } from "@/lib/scores";

export function PremiumContent({ scan }: { scan: ScanResult }) {
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

      {/* ── Scan Again ── */}
      <a
        href="/scan/capture"
        className="flex items-center justify-center gap-2 rounded-xl bg-bg-card border border-accent-green/30 py-4 text-sm font-semibold text-accent-green transition-colors hover:bg-accent-green/5"
      >
        📸 Re-scan to track your progress
      </a>
    </div>
  );
}
