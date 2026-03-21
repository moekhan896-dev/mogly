"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Profile {
  subscription_status: string;
  stripe_customer_id: string | null;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, stripe_customer_id")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    load();
  }, []);

  const openPortal = async () => {
    if (!userId || portalLoading) return;
    setPortalLoading(true);

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const isActive =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trial";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-sm text-text-muted">Loading...</p>
      </main>
    );
  }

  // Not logged in
  if (!userId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 gap-6">
        <h1 className="text-2xl font-bold text-text-primary">Account</h1>
        <p className="text-sm text-text-muted text-center max-w-sm">
          Sign in to manage your subscription and view your scan history.
        </p>
        <Link
          href="/auth"
          className="rounded-xl bg-accent-green px-8 py-3 text-sm font-bold text-black"
        >
          Sign In
        </Link>
        <Link href="/" className="text-xs text-text-muted hover:text-text-primary">
          ← Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg-primary px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Account</h1>

        {/* Subscription status */}
        <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-2">
            Subscription Status
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isActive ? "bg-accent-green" : "bg-text-muted"
              }`}
            />
            <span className="text-base font-semibold text-text-primary capitalize">
              {profile?.subscription_status || "Free"}
            </span>
          </div>

          {isActive && (
            <p className="mt-2 text-xs text-text-muted">
              {profile?.subscription_status === "trial"
                ? "Your free trial is active"
                : "Mogly Premium is active"}
            </p>
          )}
        </div>

        {/* Actions */}
        {isActive && profile?.stripe_customer_id ? (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="w-full rounded-xl bg-bg-card border border-white/[0.06] py-4 text-sm font-semibold text-text-primary hover:border-white/10 transition-colors disabled:opacity-50"
          >
            {portalLoading ? "Loading..." : "Manage Subscription"}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Upgrade to Mogly Premium for detailed skin analysis, fix plans, and product recommendations.
            </p>
            <Link
              href="/"
              className="w-full rounded-xl bg-accent-green py-4 text-center text-sm font-bold text-black"
            >
              Get Your Mogly Score
            </Link>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/"
          className="mt-8 block text-center text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
