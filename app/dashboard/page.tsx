import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard — Mogly",
  description: "Track your skin health journey",
};

async function getDashboardData(userId: string) {
  const supabase = createClient();

  // Get streak
  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .single();

  // Get latest scan
  const { data: latestScan } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get all scans for history
  const { data: scanHistory } = await supabase
    .from("scans")
    .select("id, overall_score, image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get today's routine completions
  const today = new Date().toISOString().split("T")[0];
  const { data: completions } = await supabase
    .from("routine_completions")
    .select("step_number")
    .eq("user_id", userId)
    .eq("completed_date", today);

  return {
    streak: streak?.current_streak || 0,
    latestScan,
    scanHistory: scanHistory || [],
    completions: completions || [],
  };
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const data = await getDashboardData(user.id);

  return <DashboardClient {...data} latestScan={data.latestScan} />;
}
