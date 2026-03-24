"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number): string {
  if (score >= 80) return "#00E5A0";
  if (score >= 60) return "#FBBF24";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

function getReactionLabel(score: number): string {
  if (score >= 80) return "Outstanding ✨";
  if (score >= 60) return "Above Average 💪";
  if (score >= 40) return "Room to Grow 📈";
  return "Rapid Gains Ahead 🚀";
}

export function AnimatedScore({
  value,
  skinAge,
  percentileCopy,
}: {
  value: number;
  color?: string; // kept for backwards compat, unused — color is derived from score
  skinAge?: number;
  percentileCopy?: string;
}) {
  // 0=suspense  1=counting  2=landed  3=reaction
  const [phase, setPhase] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);

  const targetScore = value;
  const finalColor = getScoreColor(targetScore);

  useEffect(() => {
    // Phase 1 slow ring fill (up to ~5 on ring) during suspense
    const ringInterval = setInterval(() => {
      setRingProgress((prev) => Math.min(prev + 0.3, 5));
    }, 50);

    // Phase 2 starts at 1.5s
    const phase1Timer = setTimeout(() => {
      clearInterval(ringInterval);
      setPhase(1);

      const startTime = Date.now();
      const countDuration = 1300;

      const countUp = () => {
        const elapsed = Date.now() - startTime;
        const raw = Math.min(elapsed / countDuration, 1);
        // Ease out cubic — fast start, decelerates near target
        const eased = 1 - Math.pow(1 - raw, 3);

        const current = Math.round(eased * targetScore);
        setDisplayScore(current);
        setRingProgress(eased * targetScore);

        if (raw < 1) {
          requestAnimationFrame(countUp);
        } else {
          // Phase 3: land + tiny bounce
          setPhase(2);
          setDisplayScore(targetScore);
          setRingProgress(targetScore);

          try { navigator.vibrate?.(50); } catch {}

          setTimeout(() => {
            setDisplayScore(targetScore + 1);
            setTimeout(() => {
              setDisplayScore(targetScore);
              setTimeout(() => setPhase(3), 300);
            }, 100);
          }, 100);
        }
      };

      requestAnimationFrame(countUp);
    }, 1500);

    return () => {
      clearTimeout(phase1Timer);
      clearInterval(ringInterval);
    };
  }, [targetScore]);

  const r = 52;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (ringProgress / 100) * circumference;
  const scoreColor = phase >= 2 ? finalColor : "#444";

  return (
    <>
      <style>{`
        @keyframes mogly-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes mogly-scale-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Ring */}
      <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 8px" }}>
        <svg
          width="180"
          height="180"
          viewBox="0 0 120 120"
          style={{ position: "absolute", inset: 0 }}
        >
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1a1a2e" strokeWidth="5" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={scoreColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            transform="rotate(-90 60 60)"
            style={{
              transition: phase <= 1 ? "stroke 0.5s ease" : "stroke 0.5s ease",
              filter: phase >= 2 ? `drop-shadow(0 0 8px ${finalColor}55)` : "none",
            }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {phase === 0 ? (
            <span
              style={{
                fontSize: "12px",
                color: "#555",
                fontFamily: "monospace",
                animation: "mogly-pulse 1.5s ease-in-out infinite",
              }}
            >
              analyzing...
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: "52px",
                  fontWeight: "bold",
                  lineHeight: 1,
                  color: scoreColor,
                  textShadow: phase >= 2 ? `0 0 40px ${finalColor}4D` : "none",
                  animation: phase === 2 ? "mogly-scale-pop 0.3s ease" : "none",
                  transition: "color 0.5s ease, text-shadow 0.5s ease",
                }}
              >
                {displayScore}
              </span>
              <span style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>/100</span>
            </>
          )}
        </div>
      </div>

      {/* Reaction text — fades in during phase 3 */}
      <div
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 0.8s ease",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#fff", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
          {getReactionLabel(targetScore)}
        </p>

        {percentileCopy && (
          <div className="rounded-full bg-bg-card px-4 py-1.5 text-xs inline-block mb-2">
            <span className="font-semibold text-text-primary">{percentileCopy}</span>
          </div>
        )}

        {skinAge && skinAge > 0 && (
          <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Skin Age:{" "}
            <span style={{ color: finalColor, fontWeight: "bold" }}>{skinAge}</span>
          </p>
        )}
      </div>
    </>
  );
}
