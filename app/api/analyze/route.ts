import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, concern, ageRange, routineLevel, goal } = body;
    console.log("📨 Received request, imageUrl:", imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    console.log("🖼️ Base64 length:", base64Image.length);
    console.log("🚀 Calling Gemini 2.5 Flash...");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                  },
                },
                {
                  text: `You are Mogly, a skincare wellness app AI. Analyze this selfie and return ONLY valid JSON with no explanation.

User: concern=${concern}, age=${ageRange}, routine=${routineLevel}, goal=${goal}

Return exactly this structure:
{
  "overall_score": <0-100>,
  "clarity_score": <0-100>,
  "glow_score": <0-100>,
  "texture_score": <0-100>,
  "hydration_score": <0-100>,
  "evenness_score": <0-100>,
  "firmness_score": <0-100>,
  "percentile": <1-100>,
  "conditions": [{"name":"string","severity":"mild|moderate|severe","area":"string","description":"string"}],
  "score_killer": "biggest issue in one sentence",
  "improvement_plan": [{"step":1,"action":"string","why":"string","impact":"+X points"}],
  "product_recs": [{"product":"string","brand":"string","why":"string","price_range":"$"}],
  "dietary_triggers": [{"trigger":"string","impact":"string","recommendation":"string"}]
}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();
    console.log("✅ Gemini response:", JSON.stringify(geminiData).substring(0, 200));

    if (!geminiRes.ok) {
      console.error("❌ Gemini error:", geminiData);
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 500 }
      );
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("📝 Content:", content?.substring(0, 100));

    if (!content) {
      console.error("❌ No content from Gemini");
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    let results;
    try {
      results = JSON.parse(content);
      console.log("✅ JSON parsed");
    } catch (e) {
      console.error("❌ Parse failed:", content.substring(0, 200));
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scans")
      .insert({
        image_url: imageUrl,
        overall_score: results.overall_score,
        clarity_score: results.clarity_score,
        glow_score: results.glow_score,
        texture_score: results.texture_score,
        hydration_score: results.hydration_score,
        evenness_score: results.evenness_score,
        firmness_score: results.firmness_score,
        percentile: results.percentile,
        conditions: results.conditions,
        score_killer: results.score_killer,
        improvement_plan: results.improvement_plan,
        product_recs: results.product_recs,
        dietary_triggers: results.dietary_triggers,
        raw_ai_response: results,
        onboarding_data: { concern, ageRange, routineLevel, goal },
        user_id: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ DB error:", error);
      throw error;
    }

    console.log("✅ Saved scan ID:", data.id);
    return NextResponse.json({ scanId: data.id, results });
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
