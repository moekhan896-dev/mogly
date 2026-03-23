import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { message, scanId } = await request.json();

    if (!message || !scanId) {
      return NextResponse.json(
        { error: "Missing message or scanId" },
        { status: 400 }
      );
    }

    // Fetch scan data from Supabase using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: scan } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (!scan) {
      return NextResponse.json(
        { reply: "I couldn't find your scan. Please take a new scan to chat with me!" },
        { status: 200 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are Mogly Coach, a friendly expert skincare advisor. Here is the user's skin data:
- Score: ${scan.overall_score || "unknown"}/100
- Skin Age: ${scan.skin_age || "unknown"}
- Conditions: ${scan.conditions ? JSON.stringify(scan.conditions) : "none"}
- Treatment Plan: ${scan.improvement_plan ? JSON.stringify(scan.improvement_plan) : "none"}
- Clarity Score: ${scan.clarity_score || 0}
- Glow Score: ${scan.glow_score || 0}
- Texture Score: ${scan.texture_score || 0}
- Hydration Score: ${scan.hydration_score || 0}
- Evenness Score: ${scan.evenness_score || 0}
- Firmness Score: ${scan.firmness_score || 0}

Rules:
- Reference their specific conditions and scores in every answer
- Recommend specific ingredients and explain why at molecular level
- Name affordable brands (CeraVe, The Ordinary, Paula's Choice)
- Keep responses 2-4 sentences, warm but clinical
- End with encouragement about their progress potential`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: message },
    ]);

    const reply =
      result.response.text() ||
      "Sorry, I had trouble processing that. Please try again!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json(
      { reply: "Sorry, I had trouble processing that. Please try again!" },
      { status: 200 }
    );
  }
}
