import type { Metadata, Viewport } from "next";
import { Instrument_Sans, DM_Mono } from "next/font/google";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/lib/analytics";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mogly — AI Skin Score",
  description:
    "Find out what your skin is really telling you. Free AI-powered skin analysis in 10 seconds.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mogly.app"),
  openGraph: {
    title: "Mogly — AI Skin Score",
    description:
      "Find out what your skin is really telling you. Free AI-powered skin analysis in 10 seconds.",
    siteName: "Mogly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mogly — AI Skin Score",
    description:
      "Find out what your skin is really telling you. Free AI-powered skin analysis in 10 seconds.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PostHog — uncomment when ready:
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('YOUR_POSTHOG_KEY', {api_host: 'https://app.posthog.com'});
            `,
          }}
        />
        */}
      </head>
      <body
        className={`${instrumentSans.variable} ${dmMono.variable} font-sans antialiased bg-bg-primary text-text-primary`}
      >
        <Suspense>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
