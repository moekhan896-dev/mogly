import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isSubscribed } from "@/lib/subscription";
import { ResultsClient } from "./ResultsClient";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PageProps {
  params: { id: string };
  searchParams: { upgraded?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = getSupabase();
  const { data: scan } = await supabase
    .from("scans")
    .select("overall_score, percentile")
    .eq("id", params.id)
    .single();

  if (!scan) {
    return { title: "Mogly — AI Skin Score" };
  }

  return {
    title: `Mogly Score: ${scan.overall_score} — Top ${scan.percentile}%`,
    description: `I got a ${scan.overall_score} Mogly Score! What's yours? Get your free AI skin analysis at mogly.app`,
    openGraph: {
      title: `My Mogly Score: ${scan.overall_score}`,
      description: `Top ${scan.percentile}% of users. Get your free AI skin analysis.`,
    },
  };
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const supabase = getSupabase();

  // Fetch this scan
  const { data: scan, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !scan) {
    notFound();
  }

  // Fetch score history if user has multiple scans
  let history: { date: string; score: number }[] = [];
  if (scan.user_id) {
    const { data: allScans } = await supabase
      .from("scans")
      .select("created_at, overall_score")
      .eq("user_id", scan.user_id)
      .order("created_at", { ascending: true });

    if (allScans && allScans.length > 1) {
      history = allScans.map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: s.overall_score,
      }));
    }
  }

  // Check premium status
  let isPremium = false;
  if (scan.user_id) {
    try {
      isPremium = await isSubscribed(scan.user_id);
      console.log("DEBUG isSubscribed returned:", isPremium, "for user:", scan.user_id);
    } catch (error) {
      // Default to free if subscription check fails
      console.log("DEBUG isSubscribed error:", error);
      isPremium = false;
    }
  } else {
    console.log("DEBUG no user_id, isPremium stays false");
  }

  const justUpgraded = searchParams.upgraded === "true";

  return (
    <ResultsClient
      scan={scan}
      isPremium={isPremium}
      history={history}
      justUpgraded={justUpgraded}
    />
  );
}
