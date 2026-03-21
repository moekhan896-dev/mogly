import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* -------------------------------------------------- */
/*  Supabase admin client (service role — bypasses RLS) */
/* -------------------------------------------------- */
let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

/* -------------------------------------------------- */
/*  Simple in-memory rate limiter (3 scans/IP/day)     */
/* -------------------------------------------------- */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24h from now
    });
    return true;
  }

  if (entry.count >= 3) return false;

  entry.count++;
  return true;
}

// Clean up stale entries every 10 minutes
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetAt) rateLimitMap.delete(key);
    });
  };
  setInterval(cleanup, 10 * 60 * 1000);
}

/* -------------------------------------------------- */
/*  System prompt builder                              */
/* -------------------------------------------------- */
function buildSystemPrompt(
  concern: string,
  ageRange: string,
  routineLevel: string,
  goal: string
): string {
  return `You are an expert dermatological AI. Analyze the uploaded facial skin photo and return a detailed skin assessment.

The user's primary concern is: ${concern}
Age range: ${ageRange}
Current routine level: ${routineLevel}
Skin goal: ${goal}

Return ONLY valid JSON with NO markdown formatting, NO backticks, NO explanation outside the JSON. Use this exact structure:

{
  "overall_score": <integer 0-100>,
  "clarity_score": <integer 0-100>,
  "glow_score": <integer 0-100>,
  "texture_score": <integer 0-100>,
  "hydration_score": <integer 0-100>,
  "evenness_score": <integer 0-100>,
  "firmness_score": <integer 0-100>,
  "percentile": <integer 1-100>,
  "conditions": [
    {
      "name": "<condition name>",
      "severity": "<mild|moderate|severe>",
      "area": "<affected area>",
      "description": "<1 sentence explanation>"
    }
  ],
  "score_killer": "<the single biggest factor hurting the score, 1 sentence>",
  "improvement_plan": [
    {
      "step": <number 1-5>,
      "action": "<specific actionable step>",
      "why": "<1 sentence reason>",
      "impact": "<estimated score improvement>"
    }
  ],
  "product_recs": [
    {
      "product": "<product name>",
      "brand": "<brand>",
      "why": "<why this product>",
      "price_range": "<$/$$/$$$>"
    }
  ],
  "dietary_triggers": [
    {
      "trigger": "<food category>",
      "impact": "<how it affects skin>",
      "recommendation": "<what to do>"
    }
  ]
}

Scoring guide: 90-100 exceptional, 75-89 good with minor concerns, 60-74 average with noticeable issues, 40-59 below average, below 40 significant issues. Be honest but constructive. Give specific, actionable advice personalized to their concern and goal.`;
}

/* -------------------------------------------------- */
/*  Parse AI response — strip markdown fences if any   */
/* -------------------------------------------------- */
function parseAIResponse(raw: string): Record<string, unknown> | null {
  let cleaned = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/* -------------------------------------------------- */
/*  POST /api/analyze                                  */
/* -------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    /* ── Rate limit ── */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "You've used your free scans today. Create an account for unlimited access.",
        },
        { status: 429 }
      );
    }

    /* ── Parse request (FormData from capture page) ── */
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const concern = (formData.get("concern") as string) || "general";
    const ageRange = (formData.get("ageRange") as string) || "unknown";
    const routineLevel = (formData.get("routineLevel") as string) || "unknown";
    const goal = (formData.get("goal") as string) || "general";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    /* ── Upload to Supabase Storage ── */
    const timestamp = Date.now();
    const ext = imageFile.type === "image/png" ? "png" : "jpg";
    const storagePath = `anonymous/${timestamp}.${ext}`;

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await getSupabase().storage
      .from("skin-photos")
      .upload(storagePath, buffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image. Please try again." },
        { status: 500 }
      );
    }

    // Get a signed URL (private bucket — not public)
    const { data: signedData, error: signedError } = await getSupabase().storage
      .from("skin-photos")
      .createSignedUrl(storagePath, 60 * 10); // 10 min expiry

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);
      return NextResponse.json(
        { error: "Failed to process image." },
        { status: 500 }
      );
    }

    const imageUrl = signedData.signedUrl;

    /* ── Convert image to base64 for OpenAI ── */
    const base64Image = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    /* ── Call OpenAI GPT-4o Vision ── */
    const systemPrompt = buildSystemPrompt(concern, ageRange, routineLevel, goal);

    let parsed: Record<string, unknown> | null = null;

    const openai = getOpenAI();

    // First attempt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: "Analyze this face and return the JSON skin assessment.",
            },
          ],
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content || "";
    parsed = parseAIResponse(rawResponse);

    // Retry once if parse failed
    if (!parsed) {
      console.warn("First parse failed, retrying...");
      const retry = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "high" },
              },
              {
                type: "text",
                text: "Analyze this face and return the JSON skin assessment.",
              },
            ],
          },
          { role: "assistant", content: rawResponse },
          {
            role: "user",
            content:
              "That response was not valid JSON. Return ONLY the raw JSON object, no markdown, no backticks, no explanation.",
          },
        ],
      });

      const retryRaw = retry.choices[0]?.message?.content || "";
      parsed = parseAIResponse(retryRaw);
    }

    if (!parsed) {
      console.error("AI response parse failed after retry:", rawResponse);
      return NextResponse.json(
        { error: "Our AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    /* ── Save to Supabase scans table ── */
    const scanRow = {
      image_url: imageUrl,
      overall_score: parsed.overall_score as number,
      clarity_score: parsed.clarity_score as number,
      glow_score: parsed.glow_score as number,
      texture_score: parsed.texture_score as number,
      hydration_score: parsed.hydration_score as number,
      evenness_score: parsed.evenness_score as number,
      firmness_score: parsed.firmness_score as number,
      percentile: parsed.percentile as number,
      conditions: parsed.conditions,
      score_killer: parsed.score_killer as string,
      improvement_plan: parsed.improvement_plan,
      product_recs: parsed.product_recs,
      dietary_triggers: parsed.dietary_triggers,
      raw_ai_response: parsed,
      onboarding_data: { concern, ageRange, routineLevel, goal },
      user_id: null, // anonymous scan
    };

    const { data: scanData, error: scanError } = await getSupabase()
      .from("scans")
      .insert(scanRow)
      .select("id")
      .single();

    if (scanError || !scanData) {
      console.error("Scan insert error:", scanError);
      return NextResponse.json(
        { error: "Failed to save results. Please try again." },
        { status: 500 }
      );
    }

    /* ── Return ── */
    return NextResponse.json({
      scanId: scanData.id,
      results: parsed,
    });
  } catch (err: unknown) {
    console.error("Analyze endpoint error:", err);

    // OpenAI specific errors
    const message =
      err instanceof Error ? err.message : "Unknown error";

    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "Our AI is busy. Please wait a moment and try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong analyzing your photo. Please try again." },
      { status: 500 }
    );
  }
}
