"use client";

import { useEffect, useState } from "react";

export function AnimatedScore({
  value,
  color,
  duration = 2000,
}: {
  value: number;
  color: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [hasLanded, setHasLanded] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    const rngDuration = 1500; // Random number cycling for 1.5s
    const slowdownDuration = 500; // Slow down for 0.5s
    const totalDuration = rngDuration + slowdownDuration;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (elapsed < rngDuration) {
        // Random number cycling phase
        const randomNum = Math.floor(Math.random() * 100);
        setDisplay(randomNum);
      } else {
        // Slow-down and landing phase
        const slowdownProgress = (elapsed - rngDuration) / slowdownDuration;
        const eased = slowdownProgress; // Linear slowdown
        setDisplay(Math.round(eased * value + (1 - eased) * display));

        if (slowdownProgress >= 1) {
          setDisplay(value);
          setHasLanded(true);
        }
      }

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <div className="relative inline-block">
      <span
        className={`font-bold leading-none inline-block ${hasLanded ? "animate-sonar-ping" : ""}`}
        style={{
          fontSize: "clamp(72px, 12vw, 96px)",
          color,
          textShadow: `0 0 40px ${color}4D`,
        }}
      >
        {display}
      </span>
    </div>
  );
}
