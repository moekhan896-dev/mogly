import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ isPremium: false });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    const s = data?.subscription_status;
    const isPremium = s === "premium" || s === "active" || s === "trial";
    return NextResponse.json({ isPremium });
  } catch {
    return NextResponse.json({ isPremium: false });
  }
}
