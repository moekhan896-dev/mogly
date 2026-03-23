"use client";

import { useState } from "react";

interface EmailCaptureCardProps {
  scanId: string;
}

type EmailStatus = "idle" | "sending" | "success" | "error";

export function EmailCaptureCard({ scanId }: EmailCaptureCardProps) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setEmailStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scanId }),
      });

      if (res.ok) {
        setEmailStatus("success");
        setEmail("");
        // Reset to idle after 5 seconds
        setTimeout(() => setEmailStatus("idle"), 5000);
      } else {
        setEmailStatus("error");
        setTimeout(() => setEmailStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  if (emailStatus === "success") {
    return (
      <div className="rounded-xl bg-accent-green/10 border border-accent-green/20 p-5 text-center">
        <p className="text-sm font-semibold text-accent-green">
          ✅ You&apos;re on the list! We&apos;ll email you in 7 days.
        </p>
      </div>
    );
  }

  const isDisabled = emailStatus === "sending" || !email;
  const isError = emailStatus === "error";

  const getButtonText = () => {
    switch (emailStatus) {
      case "sending":
        return "Saving...";
      case "error":
        return "❌ Try again";
      default:
        return "Notify";
    }
  };

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
          disabled={isDisabled}
          className="flex-1 rounded-lg bg-bg-primary px-3 py-2 text-sm border border-white/[0.06] placeholder:text-text-muted focus:outline-none focus:border-accent-gold/40 disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={isDisabled}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            isError
              ? "border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red/20"
              : "border border-accent-gold/30 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 disabled:opacity-50"
          }`}
        >
          {getButtonText()}
        </button>
      </form>
    </div>
  );
}
