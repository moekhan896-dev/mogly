import { NextRequest, NextResponse } from "next/server";

interface CoachRequest {
  message: string;
  score: number;
  conditions: Array<{ name: string; severity: string; area: string; description: string }>;
  improvementPlan: Array<{ step: number; action: string; why: string; impact: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const { message, score, conditions, improvementPlan }: CoachRequest = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    // Build system prompt with user context
    const conditionsList = conditions
      .map((c) => `${c.name} (${c.severity}) in ${c.area}`)
      .join(", ");

    const systemPrompt = `You are a friendly, expert skincare coach. The user's skin score is ${score}, their conditions are: ${conditionsList}. Their fix plan includes: ${improvementPlan.map((p) => p.action).join(", ")}. Answer their questions with specific, actionable skincare advice personalized to their skin data. Keep responses under 3 sentences. Be warm but clinical. Reference their specific conditions by name. Avoid making medical diagnoses.`;

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini error:", geminiData);
      return NextResponse.json(
        { error: "Coach unavailable" },
        { status: 500 }
      );
    }

    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!response) {
      return NextResponse.json(
        { error: "No response from coach" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Coach error:", error);
    return NextResponse.json(
      { error: "Failed to get coach response" },
      { status: 500 }
    );
  }
}
