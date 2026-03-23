"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const PRESET_QUESTIONS = [
  "What should my morning routine be?",
  "What ingredients should I avoid?",
  "How can I improve my score?",
  "What foods help my skin?",
];

export function CoachClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Failed to get coach response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I had trouble responding. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary flex flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">Skin Coach 💬</h1>
        <p className="text-xs text-text-muted mt-1">
          Get personalized skincare advice
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-2xl mb-3">👋</p>
            <p className="text-text-primary font-semibold mb-1">
              Hi! I&apos;m your Mogly skin coach
            </p>
            <p className="text-xs text-text-muted max-w-xs">
              Ask me anything about your skin and I&apos;ll give you personalized
              advice based on your analysis.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-accent-green text-black"
                      : "bg-bg-card border border-white/[0.06] text-text-primary"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-bg-card border border-white/[0.06] px-4 py-3 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-accent-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-accent-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Preset Questions */}
      {messages.length === 0 && (
        <div className="px-6 py-4 space-y-2">
          <p className="text-xs text-text-muted font-semibold mb-2">
            Ask me about:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(question)}
                className="text-left text-sm rounded-lg bg-bg-card border border-white/[0.06] p-3 hover:border-accent-green/30 transition-colors text-text-primary"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-32 left-0 right-0 bg-bg-primary/95 backdrop-blur border-t border-white/[0.06] px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                sendMessage(input);
              }
            }}
            placeholder="Ask your skin coach..."
            className="flex-1 rounded-lg bg-bg-card border border-white/[0.06] px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/50 outline-none focus:border-accent-green/50"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-accent-green text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="coach" />
    </main>
  );
}
