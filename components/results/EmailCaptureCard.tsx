"use client";

import { useState } from "react";

interface EmailCaptureCardProps {
  scanId: string;
}

export function EmailCaptureCard({ scanId }: EmailCaptureCardProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scanId }),
      });

      if (res.ok) {
        setSuccess(true);
        setEmail("");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl bg-accent-green/10 border border-accent-green/20 p-5 text-center">
        <p className="text-sm font-semibold text-accent-green">
          ✅ Subscribed! We&apos;ll email you in 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-bg-card p-5 text-center">
      <p className="text-sm font-semibold text-text-primary mb-1">
        📧 Get your free mini skin report
      </p>
      <p className="text-[11px] text-text-muted mb-3">
        We&apos;ll email your top 3 findings + 7-day re-scan reminder
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-lg bg-bg-primary px-3 py-2 text-sm border border-white/[0.06] placeholder:text-text-muted focus:outline-none focus:border-accent-gold/40 disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="rounded-lg bg-accent-gold/10 border border-accent-gold/30 px-4 py-2 text-sm font-semibold text-accent-gold hover:bg-accent-gold/20 disabled:opacity-50 transition-all"
        >
          {loading ? "..." : "Notify"}
        </button>
      </form>
    </div>
  );
}
