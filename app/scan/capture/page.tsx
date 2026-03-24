"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [existingScanId, setExistingScanId] = useState<string | null>(null);
  const [limitChecked, setLimitChecked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scan limit check — free users get 1 scan only
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const { createClient: createSupa } = await import("@/lib/supabase");
        const supabase = createSupa();

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Logged-in: check premium first
          const premiumRes = await fetch("/api/check-premium", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          }).then((r) => r.json());

          const isPremium = premiumRes.isPremium === true;
          if (!isPremium) {
            const { data: scans } = await supabase
              .from("scans")
              .select("id")
              .eq("user_id", session.user.id)
              .limit(1);

            if (scans && scans.length > 0) {
              setExistingScanId(scans[0].id);
              setScanLimitReached(true);
            }
          }
        } else {
          // Anonymous: check server-side (cookie + IP)
          const limitRes = await fetch("/api/check-scan-limit").then((r) => r.json());
          if (limitRes.limited) {
            setExistingScanId(limitRes.existingScanId || localStorage.getItem("mogly_last_scan_id"));
            setScanLimitReached(true);
          } else {
            // Also check localStorage as fallback
            const storedId = localStorage.getItem("mogly_last_scan_id");
            if (storedId) {
              setExistingScanId(storedId);
              setScanLimitReached(true);
            }
          }
        }
      } catch {}
      setLimitChecked(true);
    };

    checkLimit();
  }, []);

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
    setProgress(0);
    setError(null);
    progressRef.current = 0;

    // Smooth asymptotic progress: fast start, slows near 95%, never freezes
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const p = Math.round(95 * (1 - Math.exp(-elapsed / 5)));
      progressRef.current = p;
      setProgress(p);
      const stepIndex = Math.min(
        Math.floor((p / 95) * LOADING_STEPS.length),
        LOADING_STEPS.length - 1
      );
      setLoadingText(LOADING_STEPS[stepIndex]);
    }, 50);

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
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();

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

      // Generate canvas-based browser fingerprint
      let fingerprint = "none";
      try {
        const fpCanvas = document.createElement("canvas");
        const fpCtx = fpCanvas.getContext("2d")!;
        fpCtx.textBaseline = "top";
        fpCtx.font = "14px Arial";
        fpCtx.fillText("mogly-fp-🌿", 2, 2);
        fingerprint = fpCanvas.toDataURL().slice(-32);
      } catch {}

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
          fingerprint,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "FREE_SCAN_USED" && data.existingScanId) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          localStorage.setItem("mogly_last_scan_id", data.existingScanId);
          window.location.href = `/results/${data.existingScanId}`;
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.scanId) {
        localStorage.setItem("mogly_last_scan_id", data.scanId);
      }

      // API responded — clear the asymptotic interval, then smoothly fill to 100
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setLoadingText("Analysis complete!");
      await new Promise<void>((resolve) => {
        let current = progressRef.current;
        const finishInterval = setInterval(() => {
          current += 2;
          if (current >= 100) {
            setProgress(100);
            clearInterval(finishInterval);
            resolve();
          } else {
            setProgress(current);
          }
        }, 20);
      });
      await new Promise((r) => setTimeout(r, 150));
      window.location.href = `/results/${data.scanId || 1}`;
    } catch (err) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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
            <circle cx="40" cy="40" r="34" fill="none" stroke="#00E5A0" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 213} 213`} transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#00E5A0" }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <p style={{ color: "#00E5A0", fontSize: "14px", fontFamily: "monospace", textAlign: "center" }}>
          {loadingText}
        </p>
        <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
          This usually takes 5-8 seconds
        </p>
      </div>
    );
  }

  // LIMIT CHECK IN PROGRESS
  if (!limitChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A12" }}>
        <p style={{ color: "#888", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  // FREE SCAN LIMIT REACHED
  if (scanLimitReached && existingScanId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A12", padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</p>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>Free Scan Used</h2>
        <p style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", maxWidth: "320px", marginBottom: "32px" }}>
          Free accounts include 1 AI skin analysis. Upgrade to Premium for unlimited scans and track your improvement over time.
        </p>
        <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <a
            href={`/results/${existingScanId}`}
            style={{ display: "block", padding: "16px", backgroundColor: "#00E5A0", color: "#000", fontWeight: "bold", fontSize: "16px", borderRadius: "12px", textDecoration: "none" }}
          >
            📊 View My Results
          </a>
          <a
            href={`/results/${existingScanId}`}
            style={{ display: "block", padding: "16px", backgroundColor: "transparent", color: "#00E5A0", fontWeight: "bold", fontSize: "15px", borderRadius: "12px", border: "1px solid rgba(0,229,160,0.3)", textDecoration: "none" }}
          >
            ⭐ Upgrade to Premium — Unlimited Scans
          </a>
          <p style={{ color: "#444", fontSize: "11px", marginTop: "4px" }}>3-day free trial • Cancel anytime</p>
        </div>
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
          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />

          {/* Drop zone */}
          <div
            style={{
              width: "100%",
              aspectRatio: "3/4",
              borderRadius: "20px",
              border: "2px dashed #2a2a3e",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0e0e1a",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🤳</div>
            <p style={{ color: "#aaa", fontSize: "15px", fontWeight: "600", textAlign: "center", marginBottom: "4px" }}>
              Your skin selfie
            </p>
            <p style={{ color: "#555", fontSize: "12px", textAlign: "center" }}>
              Front-facing, good lighting
            </p>
          </div>

          {/* Two action buttons */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={{
              width: "100%", padding: "16px", marginBottom: "10px",
              backgroundColor: "#00E5A0", color: "#000", fontWeight: "700",
              fontSize: "16px", borderRadius: "14px", border: "none", cursor: "pointer",
            }}
          >
            📷 Take a Selfie
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%", padding: "14px",
              backgroundColor: "transparent", color: "#ccc",
              fontSize: "15px", borderRadius: "14px",
              border: "1px solid #2a2a3e", cursor: "pointer",
            }}
          >
            🖼️ Choose from Gallery
          </button>

          <p style={{ color: "#444", fontSize: "11px", textAlign: "center", marginTop: "16px", fontFamily: "monospace" }}>
            AI analyzes 10 skin health dimensions • Private &amp; secure
          </p>
        </div>
      )}

      {/* PREVIEW + BUTTONS - shown when photo selected */}
      {preview && (
        <div style={{ maxWidth: "400px", margin: "0 auto", marginTop: "20px" }}>
          {/* Photo preview */}
          <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "16px" }}>
            <img
              src={preview}
              alt="Your photo"
              style={{
                width: "100%",
                maxHeight: "460px",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{ position: "absolute", bottom: "12px", left: "12px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "8px", padding: "4px 10px" }}>
              <p style={{ color: "#00E5A0", fontSize: "11px", fontFamily: "monospace" }}>✓ Photo ready</p>
            </div>
          </div>

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
