import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isSubscribed } from "@/lib/subscription";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // For now, redirect to auth - in production, get user from session
  redirect("/auth");
}
