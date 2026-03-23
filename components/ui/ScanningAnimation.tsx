"use client";

import { useState, useEffect } from "react";

interface ScanningProps {
  imageUrl?: string;
}

const ANALYSIS_STEPS = [
  "Mapping dermal layer structure...",
  "Analyzing sebaceous gland activity...",
  "Measuring transepidermal water loss...",
  "Cross-referencing clinical markers...",
  "Computing composite skin health index...",
];

export function ScanningAnimation({ imageUrl }: ScanningProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Cycle through analysis steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 1500);

    return () => clearInterval(stepInterval);
  }, []);

  // Animate scan progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + 2, 100));
    }, 30);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[480px]">
        {/* Photo display with scan line */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-bg-card border border-white/[0.06]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Scanning"
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-gradient-to-b from-accent-green/10 to-transparent flex items-center justify-center">
              <span className="text-6xl opacity-20">📸</span>
            </div>
          )}

          {/* Animated scan line */}
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent"
            style={{
              top: `${scanProgress}%`,
              boxShadow: "0 0 10px rgba(0, 229, 160, 0.6)",
              animation: "none",
            }}
          />

          {/* Scan line glow */}
          <div
            className="absolute left-0 right-0 h-12 pointer-events-none"
            style={{
              top: `${Math.max(0, scanProgress - 6)}%`,
              background:
                "linear-gradient(180deg, rgba(0, 229, 160, 0.2) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Analysis text cycling */}
        <div className="text-center mb-8">
          <p className="text-sm text-text-muted h-6 transition-opacity duration-300">
            {ANALYSIS_STEPS[currentStep]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="rounded-full bg-white/[0.06] h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-green to-cyan-500 transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted text-center mt-3">
            {scanProgress}% complete
          </p>
        </div>

        {/* Diagnostic dots (optional) */}
        <div className="flex justify-center gap-1 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent-green/20 animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Status message */}
        <p className="text-center text-xs text-text-muted">
          AI analyzing your skin...
        </p>
      </div>
    </main>
  );
}
