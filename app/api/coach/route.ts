import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { message, scanId } = await request.json();

    if (!message || !scanId) {
      return NextResponse.json({ error: "Missing message or scanId" }, { status: 400 });
    }

    // Fetch scan data
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
      return NextResponse.json({
        reply: "I couldn't find your scan data. Please take a new scan to chat with me!",
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are Mogly Coach, a friendly expert skincare advisor. The user's scan data:
- Overall Score: ${scan.overall_score ?? "unknown"}/100
- Skin Age: ${scan.skin_age ?? "unknown"}
- Conditions Detected: ${scan.conditions ? JSON.stringify(scan.conditions) : "none"}
- Improvement Plan: ${scan.improvement_plan ? JSON.stringify(scan.improvement_plan) : "none"}
- Clarity: ${scan.clarity_score ?? 0} | Glow: ${scan.glow_score ?? 0} | Texture: ${scan.texture_score ?? 0}
- Hydration: ${scan.hydration_score ?? 0} | Evenness: ${scan.evenness_score ?? 0} | Firmness: ${scan.firmness_score ?? 0}

Rules:
- Always reference their specific scores and conditions
- Recommend specific ingredients and explain why
- Name affordable brands (CeraVe, The Ordinary, Paula's Choice, La Roche-Posay)
- Keep responses 2-4 sentences, warm but clinical
- End with one encouraging line about their improvement potential`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 300,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I had trouble with that. Please try again!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json({
      reply: "Sorry, I had trouble processing that. Please try again!",
    });
  }
}
