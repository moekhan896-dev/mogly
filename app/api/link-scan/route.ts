import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { scanId } = await request.json();
    if (!scanId) {
      return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
    }

    // Get the authenticated user from the session cookie
    const cookieStore = cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use service role to bypass RLS and link the scan
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await adminClient
      .from("scans")
      .update({ user_id: session.user.id })
      .eq("id", scanId)
      .is("user_id", null); // Never overwrite a scan that already belongs to someone

    if (error) {
      console.error("link-scan error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("link-scan caught:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
