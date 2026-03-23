"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: Date;
}

export function CoachClient() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Hey! 👋 I'm your Mogly Coach. Ask me anything about skincare — from your morning routine to specific ingredient recommendations.",
      timestamp: new Date(),
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

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input,
          userId: sessionData.session.user.id,
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
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Morning routine?",
    "Ingredients to avoid?",
    "How to improve my score?",
    "Foods for my skin?",
  ];

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
      <div className="px-6 py-3 border-b border-white/[0.06] flex gap-2 overflow-x-auto pb-4">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickQuestion(q)}
            className="flex-shrink-0 rounded-full bg-accent-green/10 border border-accent-green/30 px-3 py-1.5 text-xs font-medium text-accent-green hover:bg-accent-green/20 transition-colors"
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
        {loading && (
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
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-full bg-accent-green px-4 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
