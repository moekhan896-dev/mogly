import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;

function getAdmin() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

export async function isSubscribed(userId: string): Promise<boolean> {
  try {
    const supabase = getAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false; // Default to free tier if lookup fails
    }

    return (
      data.subscription_status === "premium" ||
      data.subscription_status === "active" ||
      data.subscription_status === "trial"
    );
  } catch (error) {
    // If anything fails, default to free tier
    return false;
  }
}

export async function getSubscriptionStatus(
  userId: string
): Promise<string> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  return data?.subscription_status || "free";
}
