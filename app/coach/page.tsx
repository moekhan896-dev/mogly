import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isSubscribed } from "@/lib/subscription";
import { CoachClient } from "@/components/CoachClient";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  // For now, redirect to auth - in production, get user from session
  redirect("/auth");
}
