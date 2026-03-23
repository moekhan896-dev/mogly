"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface AccountCreationModalProps {
  scanId: string;
  onComplete: () => void;
}

export function AccountCreationModal({
  scanId,
  onComplete,
}: AccountCreationModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!signUpData.user?.id) {
        setError("Signup failed");
        setLoading(false);
        return;
      }

      // Link scan to user
      const { error: updateError } = await supabase
        .from("scans")
        .update({ user_id: signUpData.user.id })
        .eq("id", scanId);

      if (updateError) {
        console.warn("Could not link scan:", updateError);
      }

      // Mark subscription as premium
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: signUpData.user.id,
          subscription_status: "premium",
        });

      if (profileError) {
        console.warn("Could not update profile:", profileError);
      }

      // Success - close modal and show results
      onComplete();
      
      // Refresh to show premium content
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-bg-card border border-accent-green/20 p-8">
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">✅</p>
          <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
          <p className="text-sm text-text-muted mt-2">
            Create your account to unlock your full results, AI Coach, Daily
            Routine, and Progress Tracking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors text-sm"
            required
            minLength={6}
          />

          {error && (
            <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-3 py-2">
              <p className="text-xs text-accent-red">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-green py-3 text-black font-bold hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? "Creating Account..." : "Create Account & View Results"}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-4">
          Your premium access is active. Create an account to save your results.
        </p>
      </div>
    </div>
  );
}
