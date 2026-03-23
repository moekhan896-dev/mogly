// Utility to update user streak

import { createClient } from "@/lib/supabase";

export async function updateStreak(userId: string) {
  const supabase = createClient();
  
  // Fetch current streak
  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  const today = new Date().toISOString().split("T")[0];

  if (!streakData) {
    // Create new streak
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      last_active: today,
      longest_streak: 1,
    });
    return 1;
  }

  const lastActive = streakData.last_active;

  // If already active today, do nothing
  if (lastActive === today) {
    return streakData.current_streak;
  }

  // Calculate days since last activity
  const lastDate = new Date(lastActive);
  const todayDate = new Date(today);
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = streakData.current_streak;
  let newLongest = streakData.longest_streak;

  if (daysDiff === 1) {
    // Consecutive day
    newStreak = streakData.current_streak + 1;
    newLongest = Math.max(newStreak, streakData.longest_streak);
  } else {
    // Streak broken
    newStreak = 1;
  }

  // Update streak
  await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      last_active: today,
      longest_streak: newLongest,
    })
    .eq("user_id", userId);

  return newStreak;
}
