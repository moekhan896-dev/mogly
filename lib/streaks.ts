import { createClient } from "@supabase/supabase-js";

export async function getOrCreateStreak(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const today = new Date().toISOString().split("T")[0];

  // Get existing streak
  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    // Create new streak
    const { data: newStreak } = await supabase
      .from("user_streaks")
      .insert({
        user_id: userId,
        current_streak: 1,
        last_active: today,
        longest_streak: 1,
      })
      .select()
      .single();
    return newStreak;
  }

  // Check if streak should continue or reset
  const lastActiveDate = new Date(existing.last_active);
  const todayDate = new Date(today);
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = existing.current_streak;
  let newLongest = existing.longest_streak;

  if (daysDiff > 1) {
    // Streak broken
    newStreak = 1;
  } else if (daysDiff === 1) {
    // Increment streak
    newStreak = existing.current_streak + 1;
    if (newStreak > existing.longest_streak) {
      newLongest = newStreak;
    }
  }
  // else daysDiff === 0: same day, no change

  // Update streak
  const { data: updated } = await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active: today,
    })
    .eq("user_id", userId)
    .select()
    .single();

  return updated;
}
