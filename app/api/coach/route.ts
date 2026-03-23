import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function getLatestScan(userId: string) {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("scans")
    .select(
      "overall_score, clarity_score, glow_score, texture_score, hydration_score, evenness_score, firmness_score, conditions, improvement_plan, skin_age"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

async function callGemini(userMessage: string, systemPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: { text: systemPrompt },
        },
        contents: {
          parts: {
            text: userMessage,
          },
        },
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response from AI";

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    // Get user's latest scan
    const scan = await getLatestScan(user.id);
    if (!scan) {
      return NextResponse.json(
        { error: "No scan found" },
        { status: 404 }
      );
    }

    // Build system prompt with user context
    const conditionsList = scan.conditions
      ?.map((c: { name: string; severity: string }) => `${c.name} (${c.severity})`)
      .join(", ") || "None";

    const systemPrompt = `You are a friendly expert skincare coach. The user's skin score is ${scan.overall_score}/100, skin age is approximately ${scan.skin_age} years old, and they have these conditions: ${conditionsList}. 

Their personalized fix plan includes: ${
      scan.improvement_plan
        ? typeof scan.improvement_plan === "string"
          ? scan.improvement_plan
          : (scan.improvement_plan as Array<{ action?: string }>).map((s) => s.action).join(", ") ||
            "Improve skincare routine"
        : "Improve skincare routine"
    }

Give specific, actionable skincare advice personalized to their data. Keep responses under 4 sentences. Be warm, encouraging, and clinical. Reference their specific conditions and scores when relevant.`;

    // Call Gemini
    const aiResponse = await callGemini(message, systemPrompt);

    return NextResponse.json({
      message: aiResponse,
      userScore: scan.overall_score,
      skinAge: scan.skin_age,
    });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json(
      { error: "Failed to get coach response" },
      { status: 500 }
    );
  }
}
