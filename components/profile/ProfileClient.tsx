"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function ProfileClient() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [stats, setStats] = useState({
    isPremium: false,
    totalScans: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth");
        return;
      }

      setUser({
        email: session.user.email || "",
        id: session.user.id,
      });

      // Fetch stats
      const { count: scanCount } = await supabase
        .from("scans")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id);

      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      // Check premium status
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setStats({
        isPremium: subscriptionData?.status === "active",
        totalScans: scanCount || 0,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
      });

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Profile 👤
          </h1>
        </div>

        {/* Account Info */}
        <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5 mb-6">
          <div className="mb-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-text-primary font-medium">{user?.email}</p>
          </div>

          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              Subscription
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {stats.isPremium ? "✅" : "🔒"}
              </span>
              <span className="text-text-primary font-medium">
                {stats.isPremium ? "Premium ✨" : "Free"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 text-center">
            <p className="text-3xl font-bold text-accent-green mb-1">
              {stats.totalScans}
            </p>
            <p className="text-xs text-text-muted">Total Scans</p>
          </div>

          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 text-center">
            <p className="text-3xl font-bold text-orange-400 mb-1">
              🔥 {stats.currentStreak}
            </p>
            <p className="text-xs text-text-muted">Current Streak</p>
          </div>

          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 text-center">
            <p className="text-3xl font-bold text-accent-gold mb-1">
              {stats.longestStreak}
            </p>
            <p className="text-xs text-text-muted">Longest Streak</p>
          </div>

          <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4 text-center">
            <p className="text-xl mb-1">
              {stats.isPremium ? "♾️" : "✨"}
            </p>
            <p className="text-xs text-text-muted">
              {stats.isPremium ? "Unlimited" : "Limited"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {stats.isPremium && (
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || "/"}
              className="block text-center rounded-xl bg-accent-gold/10 border border-accent-gold/30 py-3 text-accent-gold font-semibold hover:bg-accent-gold/20 transition-colors"
            >
              💳 Manage Subscription
            </a>
          )}

          <button
            onClick={handleSignOut}
            className="w-full rounded-xl bg-accent-red/10 border border-accent-red/30 py-3 text-accent-red font-semibold hover:bg-accent-red/20 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
          <p className="text-[11px] text-text-muted">
            Need help? Contact us at hello@getmogly.com
          </p>
        </div>
      </div>
    </main>
  );
}
