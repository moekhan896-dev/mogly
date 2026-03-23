"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: Date;
}

export function CoachClient() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [latestScan, setLatestScan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Hi! 👋 I'm your Mogly Skin Coach. I've analyzed your skin data and I'm here to help you improve. Ask me anything!",
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user and scan on mount
  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Fetch latest scan
      const { data: scans } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        setLatestScan(scans[0]);
      }

      setLoading(false);
    };

    loadUserData();
  }, []);

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleSend = async () => {
    if (!input.trim() || !latestScan) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSendLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          scanId: latestScan.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Coach API error");
      }

      const data = await response.json();

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error("Coach error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "coach",
        text: "Sorry, I'm having trouble. Try again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSendLoading(false);
    }
  };

  const quickQuestions = [
    "What should my morning routine be?",
    "What ingredients should I avoid?",
    "How can I improve my score?",
    "What foods help my skin?",
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-muted">Loading your coach...</p>
      </main>
    );
  }

  if (!user || !latestScan) {
    return (
      <main className="flex flex-col min-h-screen bg-bg-primary pb-24">
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <p className="text-6xl mb-6">💬</p>
          <h2 className="text-3xl font-bold text-text-primary mb-3">Your Skin Coach</h2>
          <p className="text-base text-text-muted mb-8 max-w-sm leading-relaxed">
            Complete your first scan to get personalized skincare advice from your AI coach.
          </p>
          <a
            href="/scan"
            className="inline-block rounded-xl bg-accent-green px-8 py-3 text-black font-semibold hover:brightness-110 transition-all"
          >
            Take Your First Scan
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 bg-bg-primary border-b border-white/[0.06] px-6 py-4 z-10">
        <h1 className="text-2xl font-bold text-text-primary">Your Skin Coach 💬</h1>
        <p className="text-xs text-text-muted mt-1">
          Personalized skincare advice based on your scan
        </p>
      </div>

      {/* Quick Questions */}
      <div className="px-6 py-3 border-b border-white/[0.06] flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickQuestion(q)}
            className="flex-shrink-0 rounded-full bg-accent-green/10 border border-accent-green/30 px-3 py-1.5 text-xs font-medium text-accent-green hover:bg-accent-green/20 transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent-green text-black"
                  : "bg-bg-card border border-white/[0.06] text-text-primary"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {sendLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-white/[0.06] text-text-primary px-4 py-2.5 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-white/[0.06] px-6 py-4 max-w-[480px] mx-auto w-full">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your coach..."
            className="flex-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
            disabled={sendLoading}
          />
          <button
            onClick={handleSend}
            disabled={sendLoading || !input.trim()}
            className="rounded-full bg-accent-green px-4 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
