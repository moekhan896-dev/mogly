import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

/**
 * GET /api/test-openai
 * Simple test endpoint to verify OpenAI API key works
 * No authentication required
 */
export async function GET(_req: NextRequest) {
  try {
    console.log("🧪 TEST: Starting OpenAI API test...");
    console.log("🧪 TEST: API Key present:", !!process.env.OPENAI_API_KEY);
    console.log(
      "🧪 TEST: API Key starts with:",
      process.env.OPENAI_API_KEY?.substring(0, 20) + "..."
    );

    const openai = getOpenAI();
    console.log("🧪 TEST: OpenAI client initialized");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: "Say 'Hello from Mogly!' in exactly those words.",
        },
      ],
    });

    console.log("✅ TEST: OpenAI API call succeeded!");
    console.log("🧪 TEST: Response:", completion.choices[0]?.message?.content);

    const response = completion.choices[0]?.message?.content || "No response";

    return NextResponse.json({
      success: true,
      message: "OpenAI API is working!",
      apiKeyValid: true,
      response: response,
      model: "gpt-4o-mini",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ TEST: OpenAI API Error:");

    if (error instanceof Error) {
      console.error("  Error message:", error.message);
      console.error("  Error name:", error.name);
      console.error("  Error stack:", error.stack);

      // Try to extract OpenAI-specific properties
      const errObj = error as unknown as Record<string, unknown>;
      if (errObj.status) console.error("  HTTP Status:", errObj.status);
      if (errObj.code) console.error("  Error code:", errObj.code);
      if (errObj.response) {
        const resp = errObj.response as Record<string, unknown>;
        console.error("  Response status:", resp.status);
        try {
          console.error("  Response data:", JSON.stringify(resp.data));
        } catch {
          console.error("  Response data:", resp.data);
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "OpenAI API error",
          apiKeyValid: false,
          error: error.message,
          errorName: error.name,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unknown error",
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
