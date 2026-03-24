"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
}

const FREE_LIMIT = 3;
const PREMIUM_LIMIT = 100;

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCoachCount(): number {
  try {
    const storedMonth = localStorage.getItem("mogly_coach_month");
    const currentMonth = getMonthKey();
    if (storedMonth !== currentMonth) {
      localStorage.setItem("mogly_coach_month", currentMonth);
      localStorage.setItem("mogly_coach_count", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("mogly_coach_count") || "0", 10);
  } catch {
    return 0;
  }
}

function incrementCoachCount() {
  try {
    const current = getCoachCount();
    localStorage.setItem("mogly_coach_count", String(current + 1));
  } catch {}
}

const QUICK_QUESTIONS = [
  { icon: "☀️", label: "Morning routine" },
  { icon: "🚫", label: "What to avoid" },
  { icon: "📈", label: "How to improve" },
  { icon: "🍎", label: "Foods for skin" },
];

export function CoachClient() {
  const supabase = createClient();

  const [latestScan, setLatestScan] = useState<Record<string, unknown> | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      let scan = null;

      if (session?.user) {
        const { data: scans } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (scans?.length) scan = scans[0];

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", session.user.id)
          .single();
        setIsPremium(profile?.subscription_status === "premium");
      }

      if (!scan) {
        const lastScanId = localStorage.getItem("mogly_last_scan_id");
        if (lastScanId) {
          const { data: orphan } = await supabase.from("scans").select("*").eq("id", lastScanId).single();
          if (orphan) {
            scan = orphan;
            if (session?.user) {
              await supabase.from("scans").update({ user_id: session.user.id }).eq("id", lastScanId);
            }
          }
        }
      }

      if (scan) {
        setLatestScan(scan);
        const conditions = (scan.conditions as Array<{ name: string }>) || [];
        setMessages([{
          id: "welcome",
          role: "coach",
          text: `Hi! 👋 I've analyzed your skin. Your score is ${scan.overall_score}/100${conditions.length > 0 ? ` and I detected ${conditions.length} condition${conditions.length > 1 ? "s" : ""}: ${conditions.map((c) => c.name).join(", ")}` : ""}. Ask me anything about your skincare routine, products, or diet!`,
        }]);
      }

      setMsgCount(getCoachCount());
      setLoading(false);
    };

    loadData();
  }, []);

  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const isLimitReached = msgCount >= limit;

  const sendMessage = async (text: string) => {
    if (!text.trim() || !latestScan || sendLoading || isLimitReached) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSendLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, scanId: latestScan.id }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "coach", text: data.reply }]);
      incrementCoachCount();
      setMsgCount((c) => c + 1);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "coach", text: "Sorry, I had trouble. Please try again." }]);
    } finally {
      setSendLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm">Loading your coach...</p>
      </main>
    );
  }

  if (!latestScan) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6 text-center pb-24">
        <p className="text-6xl mb-5">💬</p>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Your Skin Coach</h2>
        <p className="text-text-muted mb-8 max-w-xs leading-relaxed">
          Take your first scan to meet your personal AI coach
        </p>
        <a href="/scan" className="rounded-xl bg-accent-green px-8 py-3 text-black font-bold text-base">
          Get Your Skin Score
        </a>
      </main>
    );
  }

  const messagesLeft = limit - msgCount;

  return (
    <main className="flex flex-col bg-bg-primary" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">Your Skin Coach 💬</h1>
            <p className="text-[11px] text-text-muted mt-0.5">AI-powered skincare advice based on your scan</p>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            {isPremium ? `${messagesLeft} left` : `${messagesLeft}/${FREE_LIMIT} free`}
          </span>
        </div>
      </div>

      {/* Quick question pills */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-white/[0.04]">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.label}
            onClick={() => sendMessage(`${q.icon} ${q.label}`)}
            disabled={isLimitReached || sendLoading}
            className="flex-shrink-0 rounded-full bg-accent-green/10 border border-accent-green/30 px-3 py-1.5 text-xs font-medium text-accent-green hover:bg-accent-green/20 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {q.icon} {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: "100px" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-accent-green text-black font-medium"
                : "bg-bg-card border border-white/[0.06] text-text-primary"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {sendLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-white/[0.06] px-4 py-3 rounded-2xl">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: "0.3s" }} />
                <span className="text-xs text-text-muted ml-1">Coach is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Paywall banner */}
      {isLimitReached && (
        <div className="flex-shrink-0 mx-4 mb-3 rounded-xl bg-accent-green/10 border border-accent-green/30 p-4 text-center">
          <p className="text-sm font-semibold text-text-primary mb-1">
            {isPremium ? `You've used ${PREMIUM_LIMIT} messages this month` : `${FREE_LIMIT}/${FREE_LIMIT} free messages used`}
          </p>
          <p className="text-xs text-text-muted mb-3">
            {isPremium ? "Your limit resets next month." : "Upgrade to Premium for 100 messages per month."}
          </p>
          {!isPremium && (
            <a href={latestScan ? `/results/${latestScan.id as string}` : "/scan"}
              className="inline-block rounded-lg bg-accent-green px-5 py-2 text-sm font-bold text-black">
              Upgrade to Premium
            </a>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-3 bg-bg-primary" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)" }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={isLimitReached ? "Upgrade to keep chatting" : "Ask your coach..."}
            disabled={sendLoading || isLimitReached}
            className="flex-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={sendLoading || !input.trim() || isLimitReached}
            className="rounded-full bg-accent-green px-4 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-40 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
