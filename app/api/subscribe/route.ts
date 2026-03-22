import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email, scanId } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Insert into email_subscribers
    const { error } = await supabase
      .from("email_subscribers")
      .insert({
        email: email.toLowerCase().trim(),
        scan_id: scanId || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Email capture error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed! Check your email in 7 days.",
    });
  } catch (err) {
    console.error("Email endpoint error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
