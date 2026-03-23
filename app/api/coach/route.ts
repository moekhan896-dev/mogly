import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const genaiKey = process.env.GEMINI_API_KEY;

async function queryGemini(prompt: string): Promise<string> {
  if (!genaiKey) {
    return "Error: API key not configured";
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        genaiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return "Sorry, I'm having trouble thinking right now. Try again?";
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I didn't understand that.";
    return reply;
  } catch (error) {
    console.error("Coach API error:", error);
    return "Sorry, something went wrong. Try again?";
  }
}

// Verify JWT token from client
function verifyToken(token: string): { userId: string } | null {
  try {
    // For now, we'll accept the token as-is since client sends it after auth
    // In production, you'd verify the JWT signature
    // This is simplified for MVP - the client already authenticated with Supabase
    return { userId: token };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Get user's latest scan
    const { data: scans } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestScan = scans?.[0];

    if (!latestScan) {
      return NextResponse.json(
        { reply: "No scan found. Take a scan first to get personalized advice!" },
        { status: 200 }
      );
    }

    // Build system prompt with user data
    const systemPrompt = `You are a friendly expert skincare coach named Mogly Coach. 
The user's current skin score is ${latestScan.overall_score}/100.
Their skin age is ${latestScan.skin_age || "unknown"}.
${
  latestScan.conditions?.length
    ? `Their skin conditions are: ${latestScan.conditions
        .map((c: any) => `${c.name} (${c.severity})`)
        .join(", ")}.`
    : ""
}
${
  latestScan.improvement_plan?.length
    ? `Their current improvement plan includes: ${latestScan.improvement_plan
        .map((p: any) => p.action)
        .join(", ")}.`
    : ""
}

Be specific and actionable. Reference their conditions by name. 
Keep responses under 4 sentences. Be warm, encouraging, and scientific. 
If recommending products, suggest specific ingredients (niacinamide, 
salicylic acid, retinol, hyaluronic acid, etc.) and explain why at 
a molecular level when relevant.`;

    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;

    const reply = await queryGemini(fullPrompt);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Coach endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
