"use client";

import { getScoreColor } from "@/lib/scores";

const SUB_LABELS = [
  { key: "clarity_score", label: "CLARITY INDEX", icon: "✦" },
  { key: "glow_score", label: "RADIANCE LEVEL", icon: "◐" },
  { key: "texture_score", label: "SURFACE TEXTURE", icon: "⊞" },
  { key: "hydration_score", label: "HYDRATION MAP", icon: "◇" },
  { key: "evenness_score", label: "TONE UNIFORMITY", icon: "◎" },
  { key: "firmness_score", label: "ELASTICITY SCORE", icon: "◈" },
] as const;

function getVerdict(score: number): { text: string; color: string; hexColor: string } {
  if (score >= 90) return { text: "EXCEPTIONAL", color: "text-yellow-300", hexColor: "#FFD700" };
  if (score >= 75) return { text: "STRONG", color: "text-accent-green", hexColor: "#00E5A0" };
  if (score >= 60) return { text: "AVERAGE", color: "text-amber-400", hexColor: "#FBBF24" };
  if (score >= 40) return { text: "NEEDS WORK", color: "text-orange-500", hexColor: "#F97316" };
  return { text: "CRITICAL", color: "text-red-500", hexColor: "#EF4444" };
}

export function SubScoresGrid({
  scores,
}: {
  scores: Record<string, number>;
}) {
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2.5 relative z-10">
        {SUB_LABELS.map(({ key, label, icon }, i) => {
          const val = scores[key] ?? 0;
          const color = getScoreColor(val);
          const verdict = getVerdict(val);
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-bg-card border border-white/[0.06] px-3 py-3.5 animate-fade-up"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
                {label}
              </span>
              <span className="text-2xl font-bold text-text-primary">{val}</span>
              <span className={`font-mono text-[8px] uppercase tracking-[1px] ${verdict.color}`}>
                {verdict.text}
              </span>
              {/* Mini progress bar */}
              <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${val}%`,
                    backgroundColor: color,
                    transitionDelay: `${(i + 1) * 100 + 500}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Subtle connecting lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
        preserveAspectRatio="none"
      >
        <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>
    </div>
  );
}
