"use client";

import { useState, useEffect, useRef } from "react";
import type { ScanResult } from "@/lib/scores";

interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CoachClientProps {
  scan: ScanResult;
}

const PRESET_QUESTIONS = [
  "What should my morning routine be?",
  "What ingredients should I avoid?",
  "Is my skin getting better?",
  "What foods help my skin type?",
];

export function CoachClient({ scan }: CoachClientProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your skin coach. Based on your score of ${scan.overall_score}, I can help you improve with personalized advice. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          score: scan.overall_score,
          conditions: scan.conditions,
          improvementPlan: scan.improvement_plan,
        }),
      });

      const data = await res.json();
      const assistantMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't generate a response. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Coach error:", err);
      const errorMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (question: string) => {
    sendMessage(question);
  };

  return (
    <main className="flex h-screen flex-col bg-bg-primary">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-bg-card/50 px-6 py-4">
        <h1 className="text-lg font-bold text-text-primary">Your Skin Coach</h1>
        <p className="text-xs text-text-muted">Personalized advice for your skin</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-accent-green/20 text-text-primary"
                  : "bg-bg-card border border-white/[0.06] text-text-primary"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-white/[0.06] rounded-lg px-4 py-2">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Questions */}
      {messages.length === 1 && (
        <div className="px-6 py-4 space-y-2 border-t border-white/[0.06]">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handlePresetClick(q)}
              className="w-full text-left rounded-lg bg-bg-card border border-white/[0.06] hover:border-white/10 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.06] bg-bg-card/50 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask your coach..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
            disabled={loading}
            className="flex-1 rounded-lg bg-bg-primary px-4 py-2 text-sm border border-white/[0.06] placeholder:text-text-muted focus:outline-none focus:border-accent-green/40 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-accent-green/10 border border-accent-green/30 px-4 py-2 text-sm font-semibold text-accent-green hover:bg-accent-green/20 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
