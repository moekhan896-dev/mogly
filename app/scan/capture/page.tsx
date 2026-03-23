"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LOADING_STEPS = [
  "Initializing dermal analysis...",
  "Mapping melanin distribution...",
  "Measuring transepidermal water loss...",
  "Cross-referencing clinical markers...",
  "Computing composite skin health index...",
];

function CaptureInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const concern = searchParams.get("concern") || "";
  const ageRange = searchParams.get("ageRange") || "";
  const routineLevel = searchParams.get("routineLevel") || "";
  const goal = searchParams.get("goal") || "";

  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setCapturedBlob(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setCapturedBlob(null);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!capturedBlob) return;
    setLoading(true);
    setLoadingStep(0);
    setError(null);

    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1200);

    try {
      // Compress
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.src = URL.createObjectURL(capturedBlob);

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const maxWidth = 800;
      const ratio = maxWidth / Math.max(img.width, img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
      });

      // Upload to Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const timestamp = Date.now();
      const fileName = `mogly-${timestamp}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("skin-photos")
        .upload(fileName, compressedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("skin-photos")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      // Analyze
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          concern,
          ageRange,
          routineLevel,
          goal,
        }),
      });

      clearInterval(interval);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.scanId) {
        localStorage.setItem("mogly_last_scan_id", data.scanId);
      }

      window.location.href = `/results/${data.scanId || 1}`;
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed: ${message}`);
    }
  }, [capturedBlob, concern, ageRange, routineLevel, goal]);

  // LOADING SCREEN
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A12", padding: "24px" }}>
        <div style={{ marginBottom: "24px", position: "relative", width: "80px", height: "80px" }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#12121E" strokeWidth="4" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="#00E5A0" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${((loadingStep + 1) / LOADING_STEPS.length) * 213} 213`} transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#00E5A0" }}>
              {Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100)}%
            </span>
          </div>
        </div>
        <p style={{ color: "#00E5A0", fontSize: "14px", fontFamily: "monospace", textAlign: "center" }}>
          {LOADING_STEPS[loadingStep]}
        </p>
        <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
          This usually takes 5-8 seconds
        </p>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A12", padding: "24px", paddingBottom: "100px" }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* UPLOAD AREA - shown when no preview */}
      {!preview && (
        <div style={{ maxWidth: "400px", margin: "0 auto", marginTop: "40px" }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              aspectRatio: "3/4",
              borderRadius: "16px",
              border: "2px dashed #333",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backgroundColor: "#12121E",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
            <p style={{ color: "#888", fontSize: "16px", textAlign: "center" }}>
              Tap to take a selfie<br />or upload a photo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
          <p style={{ color: "#555", fontSize: "11px", textAlign: "center", marginTop: "16px", fontFamily: "monospace" }}>
            AI will analyze 10 skin health dimensions
          </p>
        </div>
      )}

      {/* PREVIEW + BUTTONS - shown when photo selected */}
      {preview && (
        <div style={{ maxWidth: "400px", margin: "0 auto", marginTop: "20px" }}>
          {/* Photo preview */}
          <img
            src={preview}
            alt="Your photo"
            style={{
              width: "100%",
              maxHeight: "450px",
              objectFit: "cover",
              borderRadius: "16px",
              display: "block",
            }}
          />

          {/* ANALYZE BUTTON */}
          <button
            onClick={submit}
            style={{
              width: "100%",
              padding: "18px",
              marginTop: "20px",
              backgroundColor: "#00E5A0",
              color: "#000000",
              fontWeight: "bold",
              fontSize: "18px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              display: "block",
            }}
          >
            ✨ Analyze My Skin
          </button>

          {/* RETAKE BUTTON */}
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              backgroundColor: "transparent",
              color: "#888888",
              fontSize: "14px",
              border: "1px solid #333333",
              borderRadius: "12px",
              cursor: "pointer",
              display: "block",
            }}
          >
            ↺ Choose Different Photo
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ maxWidth: "400px", margin: "16px auto", padding: "12px", backgroundColor: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ color: "#FF6B6B", fontSize: "14px" }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A12" }}>
          <p style={{ color: "#888", fontSize: "14px" }}>Loading...</p>
        </div>
      }
    >
      <CaptureInner />
    </Suspense>
  );
}
