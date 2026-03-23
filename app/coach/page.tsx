import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CoachClient } from "./CoachClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Skin Coach — Mogly",
  description: "Get personalized skincare advice",
};

export default async function CoachPage() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  return <CoachClient />;
}
