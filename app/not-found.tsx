import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 text-center">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        This scan doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-accent-green px-8 py-3 text-sm font-bold text-black transition-transform hover:brightness-110 active:scale-[0.98]"
      >
        Get Your Mogly Score
      </Link>
      <span className="mt-12 font-mono text-[11px] text-[#333]">
        mogly.app
      </span>
    </main>
  );
}
