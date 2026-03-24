import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const headersList = headers();

    // 1. httpOnly cookie check
    const scanCookie = cookieStore.get("mogly_scanned");
    if (scanCookie?.value) {
      return NextResponse.json({ limited: true, existingScanId: scanCookie.value });
    }

    // 2. IP check (skip localhost)
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const isLocalDev = ip === "::1" || ip === "127.0.0.1";
    if (!isLocalDev) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: ipAttempts } = await supabase
        .from("scan_attempts")
        .select("scan_id")
        .eq("ip_address", ip)
        .not("scan_id", "is", null)
        .limit(1);

      if (ipAttempts && ipAttempts.length > 0) {
        return NextResponse.json({ limited: true, existingScanId: ipAttempts[0].scan_id });
      }
    }

    return NextResponse.json({ limited: false });
  } catch {
    return NextResponse.json({ limited: false });
  }
}
