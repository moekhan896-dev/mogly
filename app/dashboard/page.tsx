"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const DAILY_TIPS = [
  "Apply SPF 30+ every morning — even indoors, UV rays pass through glass.",
  "Double cleanse at night: oil cleanser first, then water-based.",
  "Niacinamide + hyaluronic acid is one of the safest combos for all skin types.",
  "Silk pillowcases reduce friction and can help with breakouts.",
  "Vitamin C works best applied in the morning before SPF.",
  "Patch test any new product for 48 hours before full use.",
  "Retinol should be introduced slowly — start 2x per week.",
  "Cold water to rinse keeps the skin barrier intact longer.",
];

function getDailyTip() {
  const day = new Date().getDate();
  return DAILY_TIPS[day % DAILY_TIPS.length];
}

function getScoreColor(score: number) {
  if (score >= 70) return "#00E5A0";
  if (score >= 45) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Fair";
  return "Needs Care";
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [latestScan, setLatestScan] = useState<{ id: string; score: number; created_at: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/");
        return;
      }

      const email = session.user.email || "";
      setUserName(email.split("@")[0]);

      try {
        const res = await fetch("/api/check-premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const { isPremium: p } = await res.json();
        setIsPremium(p === true);
      } catch {}

      const { data: scans } = await supabase
        .from("scans")
        .select("id, score, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        setLatestScan(scans[0]);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A12" }}>
        <p style={{ color: "#888", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const tip = getDailyTip();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A12", padding: "24px", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "4px" }}>{today}</p>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "700" }}>
            Hey{userName ? `, ${userName}` : ""} 👋
          </h1>
        </div>
        <Link href="/account" style={{ width: "40px", height: "40px", backgroundColor: "#12121E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid #1e1e2e" }}>
          <span style={{ fontSize: "18px" }}>⚙️</span>
        </Link>
      </div>

      {/* Score Card */}
      {latestScan ? (
        <Link href={`/results/${latestScan.id}`} style={{ textDecoration: "none" }}>
          <div style={{ backgroundColor: "#12121E", borderRadius: "20px", padding: "24px", marginBottom: "20px", border: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#1e1e2e" strokeWidth="4" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke={getScoreColor(latestScan.score)}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(latestScan.score / 100) * 188} 188`}
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: getScoreColor(latestScan.score) }}>
                  {latestScan.score}
                </span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>LATEST SKIN SCORE</p>
              <p style={{ color: "#fff", fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
                {getScoreLabel(latestScan.score)}
              </p>
              <p style={{ color: "#555", fontSize: "11px" }}>
                {new Date(latestScan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Tap to view full analysis
              </p>
            </div>
            <span style={{ color: "#555", fontSize: "18px" }}>›</span>
          </div>
        </Link>
      ) : (
        <Link href="/scan" style={{ textDecoration: "none" }}>
          <div style={{ backgroundColor: "#12121E", borderRadius: "20px", padding: "24px", marginBottom: "20px", border: "1px dashed #2a2a3e", textAlign: "center" }}>
            <p style={{ fontSize: "36px", marginBottom: "8px" }}>🤳</p>
            <p style={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>No scan yet</p>
            <p style={{ color: "#555", fontSize: "13px" }}>Tap to get your first AI skin analysis</p>
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <p style={{ color: "#555", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "12px" }}>QUICK ACTIONS</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <Link href="/scan" style={{ textDecoration: "none" }}>
          <div style={{ backgroundColor: "#12121E", borderRadius: "16px", padding: "20px", border: "1px solid #1e1e2e" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>📸</p>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>New Scan</p>
            <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Analyze your skin</p>
          </div>
        </Link>
        <Link href="/routine" style={{ textDecoration: "none" }}>
          <div style={{ backgroundColor: "#12121E", borderRadius: "16px", padding: "20px", border: "1px solid #1e1e2e" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>📋</p>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>My Routine</p>
            <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Today&apos;s steps</p>
          </div>
        </Link>
        <Link href="/coach" style={{ textDecoration: "none" }}>
          <div style={{ backgroundColor: "#12121E", borderRadius: "16px", padding: "20px", border: "1px solid #1e1e2e" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>💬</p>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>AI Coach</p>
            <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Ask anything</p>
          </div>
        </Link>
        {isPremium ? (
          latestScan ? (
            <Link href={`/results/${latestScan.id}`} style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "#12121E", borderRadius: "16px", padding: "20px", border: "1px solid #1e1e2e" }}>
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>📊</p>
                <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>Progress</p>
                <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>View history</p>
              </div>
            </Link>
          ) : (
            <div style={{ backgroundColor: "#12121E", borderRadius: "16px", padding: "20px", border: "1px solid #1e1e2e", opacity: 0.4 }}>
              <p style={{ fontSize: "28px", marginBottom: "8px" }}>📊</p>
              <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>Progress</p>
              <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>No data yet</p>
            </div>
          )
        ) : (
          <Link href="/account" style={{ textDecoration: "none" }}>
            <div style={{ backgroundColor: "#0e1a14", borderRadius: "16px", padding: "20px", border: "1px solid rgba(0,229,160,0.2)" }}>
              <p style={{ fontSize: "28px", marginBottom: "8px" }}>⭐</p>
              <p style={{ color: "#00E5A0", fontSize: "14px", fontWeight: "600" }}>Go Premium</p>
              <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Unlimited scans</p>
            </div>
          </Link>
        )}
      </div>

      {/* Daily Tip */}
      <div style={{ backgroundColor: "#0e1a14", borderRadius: "16px", padding: "18px", border: "1px solid rgba(0,229,160,0.15)" }}>
        <p style={{ color: "#00E5A0", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "8px" }}>💡 DAILY TIP</p>
        <p style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.6" }}>{tip}</p>
      </div>
    </div>
  );
}
