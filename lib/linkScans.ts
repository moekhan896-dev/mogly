import type { SupabaseClient } from "@supabase/supabase-js";

export async function linkOrphanedScans(supabase: SupabaseClient, userId: string) {
  try {
    const lastScanId = localStorage.getItem("mogly_last_scan_id");
    if (lastScanId && userId) {
      await supabase
        .from("scans")
        .update({ user_id: userId })
        .eq("id", lastScanId)
        .is("user_id", null);
    }
  } catch {}
}
