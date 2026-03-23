import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { RoutineClient } from "./RoutineClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Daily Routine — Mogly",
  description: "Your personalized skincare routine",
};

async function getRoutineData(userId: string) {
  const supabase = createClient();

  // Get latest scan with improvement plan
  const { data: scan } = await supabase
    .from("scans")
    .select("improvement_plan, skin_age, conditions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get today's completions
  const today = new Date().toISOString().split("T")[0];
  const { data: completions } = await supabase
    .from("routine_completions")
    .select("step_number")
    .eq("user_id", userId)
    .eq("completed_date", today);

  return {
    improvementPlan: scan?.improvement_plan || [],
    skinAge: scan?.skin_age,
    completions: completions || [],
  };
}

export default async function RoutinePage() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const data = await getRoutineData(user.id);

  return <RoutineClient {...data} />;
}
