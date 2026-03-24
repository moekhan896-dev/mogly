import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkPremium(supabase: SupabaseClient, userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  const s = data?.subscription_status;
  return s === "premium" || s === "active" || s === "trial";
}
