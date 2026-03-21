"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/*
 * Simple analytics tracker.
 * Swap this out for PostHog when ready:
 *   import posthog from 'posthog-js'
 *   posthog.init('YOUR_KEY', { api_host: 'https://app.posthog.com' })
 *
 * For now, logs to console in dev and sends custom events
 * to a lightweight endpoint.
 */

// Track custom events
export function track(event: string, properties?: Record<string, unknown>) {
  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, properties);
  }

  // Send to PostHog if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined" && (window as any).posthog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog.capture(event, properties);
  }
}

// Page view tracker component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    track("page_view", { url, pathname });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

// Specific event helpers
export const analytics = {
  scanStarted: () => track("scan_started"),
  quizStep: (step: number, answer: string) =>
    track("quiz_step", { step, answer }),
  photoUploaded: () => track("photo_uploaded"),
  scanCompleted: (score: number) => track("scan_completed", { score }),
  shareClicked: (method: string) => track("share_clicked", { method }),
  paywallViewed: (scanId: string) => track("paywall_viewed", { scanId }),
  checkoutClicked: (plan: string) => track("checkout_clicked", { plan }),
  premiumUnlocked: () => track("premium_unlocked"),
};
