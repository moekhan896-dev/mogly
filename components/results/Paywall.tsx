"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";

export function Paywall({ scanId }: { scanId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("24:00:00");
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      setCheckingAuth(false);
    });
  }, []);

  // Urgency timer - 24 hour countdown stored in ref
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const totalMs = 24 * 60 * 60 * 1000; // 24 hours
      const remainingMs = Math.max(0, totalMs - elapsed);
      
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!checkingAuth) analytics.paywallViewed(scanId);
  }, [checkingAuth, scanId]);

  const plans = [
    {
      id: "weekly",
      label: "Weekly",
      price: "$9.99",
      period: "/week",
      badge: "MOST POPULAR",
      badgeColor: "#FFD700",
      trial: "3-day free trial",
      highlighted: true,
    },
    {
      id: "monthly",
      label: "Monthly",
      price: "$29.99",
      period: "/month",
      badge: null,
      badgeColor: null,
      trial: null,
      highlighted: false,
    },
    {
      id: "annual",
      label: "Annual",
      price: "$99.99",
      period: "/year",
      badge: "BEST VALUE — $8.33/mo",
      badgeColor: "#00E5A0",
      trial: null,
      highlighted: false,
    },
  ];

  const handleCheckout = async (planId: string) => {
    analytics.checkoutClicked(planId);

    // If not logged in, redirect to auth first
    if (!userId) {
      window.location.href = `/auth?redirect=/results/${scanId}`;
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, scanId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up" style={{ animationDelay: "1400ms" }}>
      {/* Urgency Timer */}
      <div className="rounded-lg bg-white/[0.05] border border-amber-400/30 px-4 py-3 text-center">
        <p className="text-xs text-text-muted mb-1">Your personalized plan expires in:</p>
        <p className="font-mono text-lg font-bold text-amber-400">{timeLeft}</p>
        <p className="text-xs text-text-muted mt-1">Unlock now to save your results</p>
      </div>

      {/* Lock header */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-lg">🔓</span>
        <span className="text-sm font-semibold text-text-primary">
          Unlock Full Diagnostic Report
        </span>
      </div>

      {/* CTA Subline */}
      <div className="text-center">
        <p className="text-xs text-text-muted">
          Improve 15+ Points in 30 Days
        </p>
      </div>

      {/* Locked items */}
      <div className="flex flex-col gap-2 px-2">
        {[
          "Detailed skin condition analysis",
          "Your personalized 5-step fix plan",
          "Product recommendations for your skin",
          "Dietary triggers affecting your score",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <span className="text-xs">🔒</span>
            <span className="text-sm text-text-muted">{item}</span>
          </div>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="flex flex-col gap-3 mt-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleCheckout(plan.id)}
            disabled={checkingAuth}
            className={`relative rounded-xl px-5 py-4 text-left transition-all hover:border-white/20 disabled:opacity-50
              ${
                plan.highlighted
                  ? "bg-bg-card border-2 border-accent-gold/60"
                  : "bg-bg-card border border-white/[0.06] hover:border-white/10"
              }`}
            style={
              plan.highlighted
                ? { boxShadow: "0 0 30px rgba(255,215,0,0.1)" }
                : undefined
            }
          >
            {/* Badge */}
            {plan.badge && (
              <span
                className="absolute -top-2.5 right-4 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${plan.badgeColor}20`,
                  color: plan.badgeColor!,
                  border: `1px solid ${plan.badgeColor}40`,
                }}
              >
                {plan.badge}
              </span>
            )}

            {/* Label/CTA Text */}
            {plan.highlighted ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-accent-gold leading-tight">
                  Start Free Trial
                </p>
                <p className="text-xs text-text-muted/80">
                  Improve 15+ Points in 30 Days
                </p>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-semibold text-text-primary">
                    {plan.label}
                  </span>
                  <span>
                    <span className="text-lg font-bold text-accent-gold">
                      {plan.price}
                    </span>
                    <span className="text-xs text-text-muted">{plan.period}</span>
                  </span>
                </div>
                {plan.trial && (
                  <p className="text-xs text-accent-green mt-1">{plan.trial}</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {plan.label}
                  </span>
                  <span>
                    <span className="text-lg font-bold text-text-primary">
                      {plan.price}
                    </span>
                    <span className="text-xs text-text-muted">{plan.period}</span>
                  </span>
                </div>
                {plan.trial && (
                  <p className="text-xs text-accent-green mt-1">{plan.trial}</p>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Trust text */}
      <div className="flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-accent-green">
          ✨ Join 2,000+ people improving their skin score
        </p>
        <p className="text-center text-[11px] text-text-muted">
          Cancel anytime&ensp;•&ensp;Instant access&ensp;•&ensp;Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
