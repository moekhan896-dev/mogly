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
      // User cancelled share or error
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
      {/* The share button */}
      <button
        onClick={handleShare}
        disabled={generating}
        className="w-full rounded-xl bg-bg-card border border-accent-green/30 py-4 text-sm font-semibold text-accent-green transition-all hover:bg-accent-green/5 disabled:opacity-50"
      >
        {generating ? "Generating..." : "📤 Share Your Mogly Score"}
      </button>

      {/* Hidden share card (rendered off-screen for html-to-image) */}
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
            background: "#0A0A12",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 60px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
          }}
        >
          {/* Glow behind score */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mainColor}15 0%, transparent 70%)`,
            }}
          />

          {/* Label */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#6B7280",
              letterSpacing: 8,
              textTransform: "uppercase" as const,
              marginBottom: 40,
              fontFamily: "monospace",
            }}
          >
            MOGLY SCORE
          </div>

          {/* Big number */}
          <div
            style={{
              fontSize: 220,
              fontWeight: 900,
              color: mainColor,
              lineHeight: 1,
              marginBottom: 30,
              textShadow: `0 0 60px ${mainColor}4D`,
            }}
          >
            {data.overall_score}
          </div>

          {/* Percentile */}
          <div
            style={{
              fontSize: 30,
              color: "#6B7280",
              marginBottom: 80,
              background: "#12121E",
              borderRadius: 50,
              padding: "14px 36px",
            }}
          >
            Top {data.percentile}% of users
          </div>

          {/* Sub-scores grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
              width: "100%",
              maxWidth: 900,
            }}
          >
            {subs.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#12121E",
                  borderRadius: 20,
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    color: "#6B7280",
                    letterSpacing: 4,
                    fontFamily: "monospace",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* Watermark */}
          <div
            style={{
              position: "absolute",
              bottom: 60,
              fontSize: 26,
              color: "#333",
              letterSpacing: 3,
              fontFamily: "monospace",
            }}
          >
            mogly.app
          </div>
        </div>
      </div>
    </>
  );
}
