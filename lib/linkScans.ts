/**
 * Links an orphaned scan (user_id = NULL) to the current authenticated user.
 * Uses the /api/link-scan route which runs with service role key to bypass RLS.
 */
export async function linkOrphanedScans(_supabase: unknown, _userId: string) {
  try {
    const lastScanId = localStorage.getItem("mogly_last_scan_id");
    if (!lastScanId) return;

    await fetch("/api/link-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId: lastScanId }),
    });
  } catch {}
}
