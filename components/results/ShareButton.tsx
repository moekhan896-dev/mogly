"use client";

import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { getScoreColor } from "@/lib/scores";
import { analytics } from "@/lib/analytics";

interface ShareCardData {
  overall_score: number;
  percentile: number;
  clarity_score: number;
  glow_score: number;
  texture_score: number;
  hydration_score: number;
  evenness_score: number;
  firmness_score: number;
  score_killer?: string;
}

function getVerdict(score: number): { text: string; color: string } {
  if (score >= 90) return { text: "EXCEPTIONAL", color: "#FFD700" };
  if (score >= 75) return { text: "STRONG", color: "#00E5A0" };
  if (score >= 60) return { text: "AVERAGE", color: "#FBBF24" };
  if (score >= 40) return { text: "NEEDS WORK", color: "#F97316" };
  return { text: "CRITICAL", color: "#EF4444" };
}

export function ShareButton({ data }: { data: ShareCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || generating) return;
    setGenerating(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        backgroundColor: "#0A0A12",
      });

      // Convert to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "mogly-score.png", { type: "image/png" });

      // Try native share first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        analytics.shareClicked("native_share");
        await navigator.share({
          title: `My Mogly Score: ${data.overall_score}`,
          text: `I got a ${data.overall_score} Mogly Score! What's yours? mogly.app`,
          files: [file],
        });
      } else {
        // Fallback: download
        analytics.shareClicked("download");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "mogly-score.png";
        link.click();
      }
    } catch (err) {
      console.log("Share cancelled or failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [data, generating]);

  const mainColor = getScoreColor(data.overall_score);

  const subs = [
    { label: "CLARITY", val: data.clarity_score },
    { label: "GLOW", val: data.glow_score },
    { label: "TEXTURE", val: data.texture_score },
    { label: "HYDRATION", val: data.hydration_score },
    { label: "EVENNESS", val: data.evenness_score },
    { label: "FIRMNESS", val: data.firmness_score },
  ];

  return (
    <>
      {/* Premium share button */}
      <button
        onClick={handleShare}
        disabled={generating}
        className="w-full rounded-xl py-4 text-base font-bold text-black transition-all disabled:opacity-50 animate-pulse"
        style={{
          background: `linear-gradient(135deg, #00E5A0 0%, #00B4D8 100%)`,
        }}
      >
        {generating ? "Generating..." : "📸 Share Your Score Card"}
      </button>

      {/* Hidden premium share card */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: 1080,
          height: 1920,
          overflow: "hidden",
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: 1080,
            height: 1920,
            background: "linear-gradient(135deg, #0A0A12 0%, #12121E 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "100px 60px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
            border: "3px solid",
            borderImage: "linear-gradient(135deg, #00E5A0 0%, #FFD700 100%) 1",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "25%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mainColor}20 0%, transparent 70%)`,
              zIndex: 1,
            }}
          />

          {/* Content wrapper */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 60,
              zIndex: 2,
            }}
          >
            {/* Label */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: 8,
                textTransform: "uppercase" as const,
                fontFamily: "monospace",
              }}
            >
              Mogly Score
            </div>

            {/* Big number */}
            <div
              style={{
                fontSize: 280,
                fontWeight: 900,
                color: mainColor,
                lineHeight: 1,
                textShadow: `0 0 80px ${mainColor}66`,
              }}
            >
              {data.overall_score}
            </div>

            {/* Percentile */}
            <div
              style={{
                fontSize: 32,
                color: "#fff",
                background: "#12121E",
                borderRadius: 60,
                padding: "16px 48px",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            >
              Top {data.percentile}% of users
            </div>

            {/* Sub-scores grid with verdicts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 24,
                width: "100%",
              }}
            >
              {subs.map((s) => {
                const verdict = getVerdict(s.val);
                return (
                  <div
                    key={s.label}
                    style={{
                      background: "#12121E",
                      borderRadius: 24,
                      padding: "32px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        color: "#6B7280",
                        letterSpacing: 4,
                        fontFamily: "monospace",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: 800,
                        color: "#fff",
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        color: verdict.color,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        letterSpacing: 2,
                      }}
                    >
                      {verdict.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA + Watermark */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#00E5A0",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              What&apos;s YOUR skin score?
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#FFD700",
                letterSpacing: 3,
                fontFamily: "monospace",
                fontWeight: 800,
              }}
            >
              mogly.app
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

