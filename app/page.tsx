import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Check if user is logged in
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/account");
  }

  return (
    <main className="relative min-h-screen bg-bg-primary overflow-hidden">
      {/* Subtle radial glow behind center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,229,160,0.04) 0%, transparent 70%)",
        }}
      />

      {/* ====== HERO — full viewport ====== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Label */}
        <p
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted mb-5"
          aria-hidden
        >
          AI-Powered Skin Analysis
        </p>

        {/* Headline */}
        <h1
          className="max-w-[720px] font-bold leading-[1.1] text-text-primary"
          style={{ fontSize: "clamp(28px, 5vw, 44px)" }}
        >
          Find out what your skin is really telling&nbsp;you.
        </h1>

        {/* Sub-headline */}
        <p className="mt-4 text-base md:text-lg text-text-muted max-w-md">
          Get your Mogly Score in 10 seconds. Free.
        </p>

        {/* CTA */}
        <Link
          href="/scan"
          className="mt-8 inline-flex items-center justify-center w-full sm:w-auto rounded-xl bg-accent-green px-10 py-4 text-[16px] sm:text-[18px] font-bold text-black transition-transform hover:brightness-110 active:scale-[0.98] animate-cta-pulse"
          style={{
            boxShadow: "0 0 30px rgba(0,229,160,0.2)",
          }}
        >
          Get Your Mogly Score&nbsp;&rarr;
        </Link>

        {/* Trust line */}
        <p className="mt-4 text-xs text-text-muted">
          No signup required&ensp;•&ensp;Takes 10 seconds
        </p>

        {/* Bottom watermark */}
        <span className="absolute bottom-6 font-mono text-[11px] text-[#333]">
          mogly.app
        </span>
      </section>

      {/* ====== BELOW THE FOLD — How it works ====== */}
      <section className="relative bg-bg-primary px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-16">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-3">
                <span className="text-4xl" role="img" aria-label={s.label}>
                  {s.icon}
                </span>
                <h3 className="text-lg font-semibold text-text-primary">
                  {s.title}
                </h3>
                <p className="text-sm text-text-muted max-w-[240px]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <p className="mt-20 text-sm text-text-muted">
            Join{" "}
            <span className="text-text-primary font-semibold">10,000+</span>{" "}
            people who discovered their skin score
          </p>
        </div>
      </section>
    </main>
  );
}

const STEPS = [
  {
    step: 1,
    icon: "📸",
    label: "camera",
    title: "Take a selfie",
    desc: "No filters. No makeup. Just you.",
  },
  {
    step: 2,
    icon: "🔬",
    label: "microscope",
    title: "AI analyzes your skin",
    desc: "Scans texture, clarity, hydration, and more.",
  },
  {
    step: 3,
    icon: "📊",
    label: "chart",
    title: "Get your Mogly Score",
    desc: "See where you stand and how to improve.",
  },
] as const;
