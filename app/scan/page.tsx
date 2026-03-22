"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";

/* -------------------------------------------------- */
/*  Types                                              */
/* -------------------------------------------------- */
interface Answers {
  concern: string;
  ageRange: string;
  routineLevel: string;
  goal: string;
  lifeChange?: string;
}

type AnswerKey = keyof Answers;

interface Option {
  icon: string;
  label: string;
  value: string;
  desc?: string;
}

interface Step {
  key: AnswerKey;
  question: string;
  layout: "grid-2x3" | "pills" | "stack" | "grid-2x2";
  options: Option[];
}

/* -------------------------------------------------- */
/*  Quiz data                                          */
/* -------------------------------------------------- */
const STEPS: Step[] = [
  {
    key: "concern",
    question: "What's your main skin concern?",
    layout: "grid-2x3",
    options: [
      { icon: "😤", label: "Acne", value: "acne" },
      { icon: "🕐", label: "Aging", value: "aging" },
      { icon: "🏜️", label: "Dryness", value: "dryness" },
      { icon: "💧", label: "Oiliness", value: "oiliness" },
      { icon: "🔴", label: "Redness", value: "redness" },
      { icon: "🌑", label: "Dark Spots", value: "dark_spots" },
    ],
  },
  {
    key: "ageRange",
    question: "How old are you?",
    layout: "pills",
    options: [
      { icon: "", label: "Under 18", value: "under_18" },
      { icon: "", label: "18-24", value: "18-24" },
      { icon: "", label: "25-34", value: "25-34" },
      { icon: "", label: "35-44", value: "35-44" },
      { icon: "", label: "45+", value: "45+" },
    ],
  },
  {
    key: "routineLevel",
    question: "How would you describe your skincare routine?",
    layout: "stack",
    options: [
      { icon: "🚫", label: "No routine", value: "none", desc: "I just wash my face" },
      { icon: "🧴", label: "Basic", value: "basic", desc: "Cleanser and moisturizer" },
      { icon: "✨", label: "Moderate", value: "moderate", desc: "Multiple steps" },
      { icon: "🔬", label: "Advanced", value: "advanced", desc: "Serums, actives, SPF daily" },
    ],
  },
  {
    key: "goal",
    question: "What's your goal?",
    layout: "grid-2x2",
    options: [
      { icon: "🎯", label: "Clear skin", value: "clear_skin" },
      { icon: "⏳", label: "Anti-aging", value: "anti_aging" },
      { icon: "✨", label: "Glow", value: "glow" },
      { icon: "🎨", label: "Even tone", value: "even_tone" },
    ],
  },
  {
    key: "lifeChange",
    question: "What would better skin change about your life?",
    layout: "grid-2x2",
    options: [
      { icon: "💪", label: "More confidence", value: "more_confidence" },
      { icon: "🎭", label: "Stop hiding behind filters", value: "no_filters" },
      { icon: "👋", label: "Better first impressions", value: "first_impressions" },
      { icon: "😌", label: "Feel comfortable in my own skin", value: "comfortable" },
    ],
  },
];

/* -------------------------------------------------- */
/*  Component                                          */
/* -------------------------------------------------- */
export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    concern: "",
    ageRange: "",
    routineLevel: "",
    goal: "",
    lifeChange: "",
  });
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  const current = STEPS[step];

  const select = useCallback(
    (value: string) => {
      if (animating) return;

      const updated = { ...answers, [current.key]: value };
      setAnswers(updated);

      // Track quiz step
      analytics.quizStep(step, value);

      // Save to localStorage for anonymous users
      try {
        localStorage.setItem("mogly_onboarding", JSON.stringify(updated));
      } catch {}

      if (step < STEPS.length - 1) {
        setDirection("forward");
        setAnimating(true);
        setTimeout(() => {
          setStep((s) => s + 1);
          setAnimating(false);
        }, 300);
      } else {
        // Last question — navigate to capture
        setTimeout(() => {
          const params = new URLSearchParams({
            concern: updated.concern,
            ageRange: updated.ageRange,
            routineLevel: updated.routineLevel,
            goal: updated.goal,
          });
          router.push(`/scan/capture?${params.toString()}`);
        }, 300);
      }
    },
    [step, answers, animating, current.key, router]
  );

  const goBack = useCallback(() => {
    if (step === 0 || animating) return;
    setDirection("back");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 250);
  }, [step, animating]);

  /* Slide classes */
  const slideClass = animating
    ? direction === "forward"
      ? "translate-x-[-20px] opacity-0"
      : "translate-x-[20px] opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <main className="relative flex min-h-screen flex-col bg-bg-primary">
      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-bg-card">
        <div
          className="h-full bg-accent-green transition-all duration-300 ease-out"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* ── Back button ── */}
      {step > 0 && (
        <button
          onClick={goBack}
          className="fixed top-6 left-5 z-50 flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* ── Step counter ── */}
      <div className="fixed top-6 right-5 z-50">
        <span className="font-mono text-[11px] tracking-widest text-text-muted">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* ── Question area ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-10">
        <div
          className={`w-full max-w-md transition-all duration-300 ease-out ${slideClass}`}
        >
          {/* Question text */}
          <h1 className="text-center text-2xl md:text-3xl font-bold text-text-primary mb-10 leading-tight">
            {current.question}
          </h1>

          {/* Options */}
          {current.layout === "grid-2x3" && (
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((o) => (
                <OptionCard
                  key={o.value}
                  option={o}
                  selected={answers[current.key] === o.value}
                  onSelect={select}
                />
              ))}
            </div>
          )}

          {current.layout === "grid-2x2" && (
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((o) => (
                <OptionCard
                  key={o.value}
                  option={o}
                  selected={answers[current.key] === o.value}
                  onSelect={select}
                />
              ))}
            </div>
          )}

          {current.layout === "pills" && (
            <div className="flex flex-wrap justify-center gap-3">
              {current.options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => select(o.value)}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-150
                    ${
                      answers[current.key] === o.value
                        ? "bg-accent-green text-black scale-105 shadow-glow-green"
                        : "bg-bg-card text-text-primary border border-white/[0.06] hover:border-accent-green/40"
                    }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {current.layout === "stack" && (
            <div className="flex flex-col gap-3">
              {current.options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => select(o.value)}
                  className={`flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-150
                    ${
                      answers[current.key] === o.value
                        ? "bg-accent-green/10 border-2 border-accent-green scale-[1.02]"
                        : "bg-bg-card border-2 border-transparent hover:border-white/10"
                    }`}
                >
                  <span className="text-2xl">{o.icon}</span>
                  <div>
                    <p className="font-semibold text-text-primary text-[15px]">
                      {o.label}
                    </p>
                    {o.desc && (
                      <p className="text-xs text-text-muted mt-0.5">{o.desc}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------- */
/*  Card component (grid layouts)                      */
/* -------------------------------------------------- */
function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: Option;
  selected: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 transition-all duration-150
        ${
          selected
            ? "bg-accent-green/10 border-2 border-accent-green scale-[1.03]"
            : "bg-bg-card border-2 border-transparent hover:border-white/10"
        }`}
    >
      <span className="text-3xl">{option.icon}</span>
      <span className="text-sm font-semibold text-text-primary">
        {option.label}
      </span>
    </button>
  );
}
