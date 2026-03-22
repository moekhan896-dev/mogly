"use client";

export function HowWeAnalyzed() {
  const aspects = [
    "Pore visibility & size",
    "Redness & inflammation",
    "Texture smoothness",
    "Brightness & luminosity",
    "Acne type & severity",
    "Fine lines & wrinkles",
  ];

  return (
    <div className="rounded-xl bg-bg-card border border-white/[0.06] p-5">
      <p className="font-mono text-[11px] tracking-[2px] text-text-muted mb-4">HOW WE ANALYZED YOU</p>
      <div className="grid grid-cols-2 gap-3">
        {aspects.map((aspect) => (
          <div key={aspect} className="flex items-start gap-2">
            <span className="text-accent-green mt-0.5 flex-shrink-0">✓</span>
            <span className="text-sm text-text-primary">{aspect}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-accent-green mt-4 pt-3 border-t border-white/[0.06]">
        Analysis matches dermatologist-grade accuracy standards
      </p>
    </div>
  );
}
