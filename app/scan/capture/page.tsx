"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { analytics } from "@/lib/analytics";

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

  const [mode, setMode] = useState<"camera" | "upload">("upload");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      startCamera();
    }
    return () => stopCamera();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError(false);
      setMode("camera");
    } catch {
      setCameraError(true);
      setMode("upload");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      "image/jpeg",
      0.92
    );
  }, [stopCamera]);

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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setPreview(null);
    setCapturedBlob(null);
    setError(null);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !cameraError) startCamera();
  }, [cameraError, startCamera]);

  const submit = useCallback(async () => {
    if (!capturedBlob) return;
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    analytics.photoUploaded();

    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1200);

    try {
      console.log("📦 Compressing image...");
      const canvas = canvasRef.current || document.createElement("canvas");
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

      console.log(`✅ Compressed: ${capturedBlob.size} → ${compressedBlob.size} bytes`);

      console.log("📤 Uploading to Supabase...");
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
      console.log("✅ Public URL:", imageUrl);

      console.log("🚀 Calling /api/analyze...");
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
        console.error("API Error:", data);
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      console.log("✅ Analysis complete");
      setLoadingStep(LOADING_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 600));

      // Save scan ID to localStorage for later account linking
      if (data.scanId) {
        localStorage.setItem('mogly_last_scan_id', data.scanId);
      }

      router.push(`/results/${data.scanId || 1}`);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Full error:", err);
      setError(`Failed: ${message}`);
    }
  }, [capturedBlob, concern, ageRange, routineLevel, goal, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6">
        <div className="relative mb-8">
          <svg width="80" height="80" viewBox="0 0 80 80" className="animate-spin-slow">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#12121E" strokeWidth="4" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#00E5A0"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${((loadingStep + 1) / LOADING_STEPS.length) * 213} 213`}
              className="transition-all duration-500 ease-out"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-accent-green">
              {Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100)}%
            </span>
          </div>
        </div>

        <p
          key={loadingStep}
          className="text-base text-text-primary font-medium animate-fade-in text-center"
        >
          {LOADING_STEPS[loadingStep]}
        </p>

        <p className="mt-3 text-xs text-text-muted">This takes about 5 seconds</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-bg-primary px-6 py-6 pb-24">
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Mode Toggle */}
        {!preview && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => {
                if (!cameraError) startCamera();
                setMode("camera");
              }}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                mode === "camera" ? "bg-accent-green text-black" : "bg-bg-card text-text-muted"
              }`}
            >
              📸 Camera
            </button>
            <button
              onClick={() => {
                stopCamera();
                setMode("upload");
              }}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                mode === "upload" ? "bg-accent-green text-black" : "bg-bg-card text-text-muted"
              }`}
            >
              📁 Upload
            </button>
          </div>
        )}

        {/* Viewfinder */}
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-bg-card border border-white/[0.04]">
          {/* Camera Feed */}
          {mode === "camera" && !preview && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
              />
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-text-muted">Starting camera...</p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <p className="text-sm text-text-muted text-center">Camera access denied.</p>
                  <button
                    onClick={() => setMode("upload")}
                    className="rounded-lg bg-accent-green px-5 py-2 text-sm font-semibold text-black"
                  >
                    Upload Instead
                  </button>
                </div>
              )}
            </>
          )}

          {/* Upload Dropzone */}
          {mode === "upload" && !preview && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                dragOver ? "bg-accent-green/5" : ""
              }`}
            >
              <div className="rounded-full bg-white/[0.04] p-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-text-muted"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-text-muted text-center px-4">
                Drag a selfie here<br />or tap to upload
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Face Guide */}
          {mode === "camera" && cameraReady && !preview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 w-full">
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-b from-accent-green/50 to-transparent animate-scan-line" />
              </div>
              <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-accent-green/60" />
              <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-accent-green/60" />
              <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-accent-green/60" />
              <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-accent-green/60" />
              <div className="w-[55%] h-[70%] rounded-[50%] border-2 border-dashed border-accent-green/30" />
            </div>
          )}
        </div>

        {/* Tips */}
        {!preview && (
          <div className="mt-6 text-center">
            <p className="font-mono text-[11px] tracking-wider text-text-muted">
              Position face within frame • Good lighting required
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-wider text-text-muted/60">
              AI will analyze 10 skin health dimensions
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full flex-col items-center gap-3 max-w-sm mx-auto">
        {/* Camera Capture */}
        {mode === "camera" && cameraReady && !preview && (
          <button
            onClick={capturePhoto}
            className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-accent-green bg-transparent transition-transform active:scale-90"
            style={{
              boxShadow: "0 0 40px rgba(0,229,160,0.3), inset 0 0 20px rgba(0,229,160,0.1)",
            }}
          >
            <div className="h-[72px] w-[72px] rounded-full bg-accent-green animate-pulse" />
          </button>
        )}

        {/* Preview Actions */}
        {preview && (
          <>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#00E5A0',
                color: '#000000',
                fontWeight: 'bold',
                fontSize: '18px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '16px',
                marginBottom: '8px',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Analyzing..." : "✨ Analyze My Skin"}
            </button>
            <button
              onClick={reset}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#888888',
                fontSize: '14px',
                border: '1px solid #333333',
                borderRadius: '12px',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              ↺ {mode === "camera" ? "Retake" : "Choose Different"}
            </button>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#00E5A0', fontSize: '14px', fontFamily: 'monospace' }}>
              {LOADING_STEPS[loadingStep]}
            </p>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              This usually takes 5-8 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full rounded-lg bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-center">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CapturePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-bg-primary">
          <p className="text-text-muted text-sm">Loading...</p>
        </main>
      }
    >
      <CaptureInner />
    </Suspense>
  );
}
