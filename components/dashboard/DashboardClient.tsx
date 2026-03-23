"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { updateStreak } from "@/lib/streaks";
import type { ScanResult } from "@/lib/scores";

interface DashboardData {
  user: { id: string; email?: string } | null;
  streak: number;
  latestScan: ScanResult | null;
  allScans: ScanResult[];
  loading: boolean;
}

const DAILY_TIPS = [
  "Sunscreen is non-negotiable: UV damage compounds over time. Use SPF 30+ daily, rain or shine.",
  "Consistency beats perfection: A simple routine you use every day beats complex skincare you skip.",
  "Hydration starts within: Drink 2-3L of water daily. Your skin is an organ, not an afterthought.",
  "Sleep repairs: Most skin healing happens at night. Aim for 7-9 hours for visible improvements.",
  "Don't over-exfoliate: 2-3x weekly is enough. More frequent exfoliation damages your skin barrier.",
  "Patch test first: Always test new products on a small area before committing to full use.",
  "Quality > quantity: 3 targeted products beat 10 random ones. Focus on your specific concerns.",
];

export function DashboardClient() {
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<DashboardData>({
    user: null,
    streak: 0,
    latestScan: null,
    allScans: [],
    loading: true,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      // Update streak
      const newStreak = await updateStreak(session.user.id);

      // Fetch user's scans
      const { data: scans } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      // Fetch streak data
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setData({
        user: session.user,
        streak: streakData?.current_streak || 0,
        latestScan: scans?.[0] || null,
        allScans: scans || [],
        loading: false,
      });
    };

    loadDashboard();
  }, []);

  if (data.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading dashboard...</p>
      </main>
    );
  }

  const getDaysAgo = (date: string): string => {
    const scanDate = new Date(date);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  };

  const getDailyTip = (): string => {
    const dayOfWeek = new Date().getDay();
    return DAILY_TIPS[dayOfWeek];
  };

  return (
    <main className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header with Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back! 👋
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Streak Display - Premium Styling */}
        {data.streak > 0 && (
          <div className="mb-8 flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-400/30 blur-lg" />
              <div className="relative bg-gradient-to-br from-orange-400 to-orange-500 rounded-full p-3 text-2xl">
                🔥
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">
                {data.streak}
              </p>
              <p className="text-xs text-text-muted">day streak</p>
            </div>
          </div>
        )}

        {/* Latest Scan Card - Premium Styling */}
        {data.latestScan && (
          <div className="rounded-xl bg-gradient-to-br from-bg-card to-bg-card border border-l-accent-green border-t-accent-green border-r-white/[0.06] border-b-white/[0.06] p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-green/20 to-cyan-500/20 border-2 border-accent-green/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="flex-1">
                <p className="text-4xl font-bold text-accent-green mb-1">
                  {data.latestScan.overall_score}
                </p>
                <p className="text-xs text-text-muted">
                  Scanned {getDaysAgo(data.latestScan.created_at)}
                </p>
              </div>
            </div>

            <Link
              href={`/results/${data.latestScan.id}`}
              className="inline-block text-sm text-accent-green hover:text-accent-gold transition-colors font-medium"
            >
              View Full Results →
            </Link>
          </div>
        )}

        {/* New Scan Button */}
        <Link
          href="/scan/capture"
          className="block w-full rounded-xl bg-gradient-to-r from-accent-green via-cyan-500 to-accent-green py-4 text-center font-bold text-black text-lg mb-8 hover:shadow-lg transition-all shadow-lg hover:brightness-110"
          style={{
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          <span>📸 New Scan</span>
        </Link>

        {/* Daily Tip */}
        <div className="rounded-xl bg-accent-green/10 border border-accent-green/20 p-5 mb-6">
          <h3 className="font-bold text-accent-green mb-2">💡 Daily Tip</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {getDailyTip()}
          </p>
        </div>

        {/* Daily Routine (quick preview) */}
        {data.latestScan?.improvement_plan &&
          data.latestScan.improvement_plan.length > 0 && (
            <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-text-primary">📋 Your Daily Routine</h2>
                <Link
                  href="/routine"
                  className="text-xs text-accent-green hover:text-accent-green/80"
                >
                  See Full →
                </Link>
              </div>
              <p className="text-xs text-text-muted">
                {data.latestScan.improvement_plan.length} steps available
              </p>
            </div>
          )}

        {/* Scan History */}
        {data.allScans.length > 0 && (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5">
            <h2 className="font-bold text-text-primary mb-4">📊 Scan History</h2>
            <div className="space-y-3">
              {data.allScans.slice(0, 5).map((scan, idx) => {
                const prevScore =
                  idx < data.allScans.length - 1
                    ? data.allScans[idx + 1].overall_score
                    : null;
                const change = prevScore ? scan.overall_score - prevScore : null;

                return (
                  <Link
                    key={scan.id}
                    href={`/results/${scan.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-colors border border-white/[0.04] hover:border-accent-green/20"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/20 flex items-center justify-center flex-shrink-0">
                      <span>📊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">
                        Score: {scan.overall_score}
                      </p>
                      <p className="text-xs text-text-muted">
                        {getDaysAgo(scan.created_at)}
                      </p>
                    </div>
                    {change !== null && (
                      <div
                        className={`text-sm font-bold flex-shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-full ${
                          change > 0
                            ? "bg-accent-green/10 text-accent-green"
                            : change < 0
                            ? "bg-accent-red/10 text-accent-red"
                            : "bg-white/[0.06] text-text-muted"
                        }`}
                      >
                        {change > 0 ? "↑" : change < 0 ? "↓" : "−"}
                        {Math.abs(change)}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {data.allScans.length === 1 && (
              <div className="mt-4 p-3 rounded-lg bg-accent-green/10 border border-accent-green/20 text-center">
                <p className="text-xs text-accent-green">
                  📈 Scan again in 7 days to track progress
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
