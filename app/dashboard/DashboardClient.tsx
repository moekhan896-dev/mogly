"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ScanResult } from "@/lib/scores";
import { BottomNav } from "@/components/BottomNav";

interface DashboardProps {
  streak: number;
  latestScan: (ScanResult & { image_url?: string }) | null;
  scanHistory: Array<{
    id: string;
    overall_score: number;
    image_url?: string;
    created_at: string;
  }>;
  completions: Array<{ step_number: number }>;
}

export function DashboardClient({
  streak,
  latestScan,
  scanHistory,
  completions,
}: DashboardProps) {
  const router = useRouter();

  const completedSteps = completions.map((c) => c.step_number);
  const routineSteps = latestScan?.improvement_plan || [];
  const completedToday = completedSteps.length;
  const totalSteps = routineSteps.length || 5;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <main className="min-h-screen bg-bg-primary pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-2xl font-bold text-text-primary">Mogly</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Streak */}
        {streak > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/30 p-6 text-center">
            <p className="text-5xl font-bold text-accent-green mb-1">🔥 {streak}</p>
            <p className="text-sm text-text-muted">
              day{streak !== 1 ? "s" : ""} streak
            </p>
          </div>
        )}

        {/* Latest Scan */}
        {latestScan ? (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] overflow-hidden">
            {latestScan.image_url && (
              <div className="relative h-40 bg-black/20">
                <Image
                  src={latestScan.image_url}
                  alt="Latest scan"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <p className="text-text-muted text-xs mb-1">Latest Score</p>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-4xl font-bold text-accent-green">
                  {Math.round(latestScan.overall_score)}
                </p>
                <p className="text-sm text-text-muted">
                  {formatDate(latestScan.created_at)}
                </p>
              </div>
              <Link
                href={`/results/${latestScan.id}`}
                className="block w-full text-center rounded-lg bg-accent-green/10 border border-accent-green/30 py-2.5 text-accent-green text-sm font-semibold hover:bg-accent-green/20 transition-colors"
              >
                View Full Results
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-6 text-center">
            <p className="text-text-muted text-sm mb-3">No scans yet</p>
            <Link
              href="/scan/capture"
              className="inline-block px-6 py-2.5 rounded-lg bg-accent-green text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Take Your First Scan
            </Link>
          </div>
        )}

        {/* New Scan Button */}
        <Link
          href="/scan/capture"
          className="block w-full rounded-xl bg-gradient-to-r from-accent-green to-emerald-500 text-black py-4 text-center font-bold text-lg hover:opacity-90 transition-opacity"
        >
          📸 New Scan
        </Link>

        {/* Routine Section */}
        {latestScan && (
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-text-muted mb-3">
              Your Daily Routine
            </h2>
            <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 space-y-2">
              <p className="text-xs text-text-muted mb-3">
                {completedToday}/{totalSteps} steps completed
              </p>
              {routineSteps.slice(0, 5).map((step: { action?: string } | string, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={completedSteps.includes(idx + 1)}
                    onChange={async (e) => {
                      if (e.target.checked) {
                        await fetch("/api/routine/complete", {
                          method: "POST",
                          body: JSON.stringify({ stepNumber: idx + 1 }),
                        });
                      } else {
                        await fetch("/api/routine/uncomplete", {
                          method: "POST",
                          body: JSON.stringify({ stepNumber: idx + 1 }),
                        });
                      }
                      router.refresh();
                    }}
                    className="w-5 h-5 rounded accent-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-text-primary">
                    {typeof step === "string"
                      ? step
                      : step.action || `Step ${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-text-muted mb-3">
              Scan History
            </h2>
            <div className="space-y-2">
              {scanHistory.map((scan, idx) => {
                const previousScore =
                  idx < scanHistory.length - 1
                    ? scanHistory[idx + 1].overall_score
                    : null;
                const scoreDiff =
                  previousScore !== null
                    ? scan.overall_score - previousScore
                    : null;

                return (
                  <Link
                    key={scan.id}
                    href={`/results/${scan.id}`}
                    className="flex items-center gap-3 rounded-lg bg-bg-card border border-white/[0.06] p-3 hover:border-white/10 transition-colors"
                  >
                    {scan.image_url && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
                        <Image
                          src={scan.image_url}
                          alt="Scan"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">
                        Score: {Math.round(scan.overall_score)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDate(scan.created_at)}
                      </p>
                    </div>
                    {scoreDiff !== null && (
                      <div
                        className={`text-sm font-semibold ${
                          scoreDiff > 0
                            ? "text-accent-green"
                            : scoreDiff < 0
                            ? "text-red-500"
                            : "text-text-muted"
                        }`}
                      >
                        {scoreDiff > 0 ? "+" : ""}{Math.round(scoreDiff)} {scoreDiff > 0 ? "↑" : "↓"}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="profile" />
    </main>
  );
}
