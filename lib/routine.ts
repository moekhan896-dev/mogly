import { createClient } from "@/lib/supabase";

/**
 * Mark a routine step as complete for today
 */
export async function completeRoutineStep(stepNumber: number) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("routine_completions")
    .upsert({
      user_id: user.id,
      step_number: stepNumber,
      completed_date: today,
    })
    .select()
    .single();

  if (error) {
    console.error("Error completing routine step:", error);
    return null;
  }

  return data;
}

/**
 * Unmark a routine step as complete
 */
export async function uncompleteRoutineStep(stepNumber: number) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("routine_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("step_number", stepNumber)
    .eq("completed_date", today);

  if (error) {
    console.error("Error uncompleting routine step:", error);
    return null;
  }

  return true;
}

/**
 * Get today's completed routine steps
 */
export async function getTodayCompletions(
  improvementPlanSteps?: Array<{ step_number: number }>
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("routine_completions")
    .select("step_number")
    .eq("user_id", user.id)
    .eq("completed_date", today);

  if (error) {
    console.error("Error fetching completions:", error);
    return [];
  }

  return data || [];
}
