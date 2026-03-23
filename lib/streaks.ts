import { createClient } from "@/lib/supabase";

/**
 * Update user streak on dashboard/app open
 * - If today: do nothing (already counted)
 * - If yesterday: increment streak
 * - If older: reset to 1
 * - Always update longest_streak
 */
export async function updateStreak() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  // Get or create streak record
  const { data: streakData, error: fetchError } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching streak:", fetchError);
    return null;
  }

  // Create streak if doesn't exist
  if (!streakData) {
    const { data, error } = await supabase
      .from("user_streaks")
      .insert({
        user_id: user.id,
        current_streak: 1,
        last_active: today,
        longest_streak: 1,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating streak:", error);
      return null;
    }
    return data;
  }

  // Check last_active date
  const lastActiveDate = new Date(streakData.last_active)
    .toISOString()
    .split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  let newStreak = streakData.current_streak;

  // Already counted today
  if (lastActiveDate === today) {
    return streakData;
  }

  // Increment if yesterday
  if (lastActiveDate === yesterday) {
    newStreak = streakData.current_streak + 1;
  } else {
    // Reset if older than yesterday
    newStreak = 1;
  }

  // Update longest streak if new streak exceeds it
  const newLongestStreak = Math.max(newStreak, streakData.longest_streak);

  const { data, error } = await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_active: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating streak:", error);
    return null;
  }

  return data;
}

/**
 * Get user's current streak
 */
export async function getStreak() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", user.id)
    .single();

  return data;
}
