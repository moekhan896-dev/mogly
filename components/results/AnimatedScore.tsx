"use client";

import { useEffect, useState } from "react";

export function AnimatedScore({
  value,
  color,
  duration = 1500,
}: {
  value: number;
  color: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span
      className="font-bold leading-none"
      style={{
        fontSize: "clamp(72px, 12vw, 96px)",
        color,
        textShadow: `0 0 40px ${color}4D`,
      }}
    >
      {display}
    </span>
  );
}
