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

  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    const rngDuration = 1500;
    const slowdownDuration = 500;
    const totalDuration = rngDuration + slowdownDuration;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (elapsed < rngDuration) {
        setDisplay(Math.floor(Math.random() * 100));
      } else {
        const slowdownProgress = (elapsed - rngDuration) / slowdownDuration;
        setDisplay(Math.round(slowdownProgress * value + (1 - slowdownProgress) * (Math.random() * 30 + 50)));

        if (slowdownProgress >= 1) {
          setDisplay(value);
        }
      }

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const circumference = 2 * Math.PI * 54; // r=54 in 120×120 viewBox
  const strokeDash = (display / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 8px" }}>
      <svg
        width="160"
        height="160"
        viewBox="0 0 120 120"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Background ring */}
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a2e" strokeWidth="6" />
        {/* Animated score ring */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          fontSize: "48px",
          fontWeight: "bold",
          lineHeight: 1,
          color,
          textShadow: `0 0 40px ${color}4D`,
        }}>
          {display}
        </span>
        <span style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>/100</span>
      </div>
    </div>
  );
}
