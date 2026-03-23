"use client";

import { useState, useEffect } from "react";

interface ScoreRevealProps {
  finalScore: number;
  onComplete?: () => void;
}

export function ScoreReveal({ finalScore, onComplete }: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<"counting" | "pulsing">("counting");

  useEffect(() => {
    // Phase 1: Slot machine effect (rapid random numbers)
    const randomInterval = setInterval(() => {
      setDisplayScore(Math.floor(Math.random() * 100));
    }, 50);

    // After 1.5 seconds, move to phase 2
    const phaseChangeTimeout = setTimeout(() => {
      clearInterval(randomInterval);
      setPhase("pulsing");

      // Phase 2: Count up to final score with easing
      let current = 0;
      const step = Math.ceil(finalScore / 30);
      const countInterval = setInterval(() => {
        current += step;
        if (current >= finalScore) {
          setDisplayScore(finalScore);
          clearInterval(countInterval);
          onComplete?.();
        } else {
          setDisplayScore(current);
        }
      }, 20);

      return () => clearInterval(countInterval);
    }, 1500);

    return () => {
      clearInterval(randomInterval);
      clearTimeout(phaseChangeTimeout);
    };
  }, [finalScore, onComplete]);

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Pulse ring (shows when in pulsing phase) */}
        {phase === "pulsing" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-accent-green animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-accent-green opacity-50 animate-pulse" 
              style={{ animationDelay: "0.2s" }} />
          </>
        )}

        {/* Score number */}
        <div className={`text-center transition-transform ${
          phase === "pulsing" ? "scale-100" : "scale-95"
        }`}>
          <p className="text-6xl font-bold text-accent-green mb-2">
            {displayScore}
          </p>
          <p className="text-sm text-text-muted">Mogly Score</p>
        </div>
      </div>
    </div>
  );
}
