import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Mogly",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-primary px-6 py-16">
      <div className="mx-auto max-w-[640px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors mb-8"
        >
          ← Back to Mogly
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="font-mono text-[11px] text-text-muted mb-10">
          Last updated: March 2026
        </p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <Section title="What We Collect">
            <p>
              When you use Mogly, we collect the selfie you upload for analysis
              and the quiz answers you provide (skin concern, age range, routine
              level, goal). If you create an account, we store your email address.
            </p>
          </Section>

          <Section title="How We Use Your Data">
            <ul className="list-disc list-inside space-y-1 text-text-muted">
              <li>Your photo is sent to our AI for skin analysis only</li>
              <li>Quiz answers personalize your results</li>
              <li>Email is used for account access and subscription management</li>
              <li>We track anonymized usage analytics to improve the product</li>
            </ul>
          </Section>

          <Section title="Photo Storage &amp; Security">
            <p>
              Photos are stored in encrypted cloud storage (Supabase) with
              row-level security. Each photo is private and accessible only to
              the user who uploaded it. Photos are never made public.
            </p>
          </Section>

          <Section title="We Never Share Your Data">
            <p>
              Your photos, analysis results, and personal information are
              <strong className="text-text-primary"> never sold or shared </strong>
              with third parties. Period. Your selfies are used exclusively to
              generate your Mogly Score.
            </p>
          </Section>

          <Section title="Data Deletion">
            <p>
              You can request deletion of all your data at any time by emailing{" "}
              <a
                href="mailto:hello@mogly.app"
                className="text-accent-green hover:underline"
              >
                hello@mogly.app
              </a>
              . We will delete your account, photos, and all associated data
              within 30 days.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use cookies only for authentication (keeping you logged in).
              No advertising cookies. No tracking cookies from third parties.
            </p>
          </Section>

          <Section title="Age Requirement">
            <p>
              Mogly is intended for users aged 13 and older. We do not knowingly
              collect data from children under 13.
            </p>
          </Section>

          <Section title="GDPR &amp; CCPA">
            <p>
              We comply with GDPR and CCPA. You have the right to access,
              correct, or delete your personal data. Contact us at{" "}
              <a
                href="mailto:hello@mogly.app"
                className="text-accent-green hover:underline"
              >
                hello@mogly.app
              </a>{" "}
              for any privacy-related requests.
            </p>
          </Section>

          <Section title="Medical Disclaimer">
            <p>
              Mogly provides AI-powered skin insights for informational purposes
              only. Our analysis is not a medical diagnosis. Always consult a
              licensed dermatologist for persistent or severe skin concerns.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Email us at{" "}
              <a
                href="mailto:hello@mogly.app"
                className="text-accent-green hover:underline"
              >
                hello@mogly.app
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-16 text-center">
          <span className="font-mono text-[11px] text-[#333]">mogly.app</span>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-text-primary mb-2">{title}</h2>
      <div className="text-text-muted">{children}</div>
    </section>
  );
}
