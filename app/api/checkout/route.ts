import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PLAN_CONFIG: Record<string, { envKey: string; trialDays: number }> = {
  weekly: { envKey: "STRIPE_WEEKLY_PRICE_ID", trialDays: 3 },
  monthly: { envKey: "STRIPE_MONTHLY_PRICE_ID", trialDays: 0 },
  annual: { envKey: "STRIPE_ANNUAL_PRICE_ID", trialDays: 0 },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, scanId } = await req.json();
    const plan = PLAN_CONFIG[planId];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = process.env[plan.envKey];
    if (!priceId) {
      return NextResponse.json(
        { error: "Plan not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const supabase = getSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Try to get auth user from cookie/header for customer linking
    // The auth token comes via cookies set by Supabase client
    let customerEmail: string | undefined;
    let existingCustomerId: string | undefined;

    // Check if we have a logged-in user by reading the auth cookie
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user?.email) {
        customerEmail = user.email;

        // Check if user already has a Stripe customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .single();

        if (profile?.stripe_customer_id) {
          existingCustomerId = profile.stripe_customer_id;
        }
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/results/${scanId}?upgraded=true`,
      cancel_url: `${appUrl}/results/${scanId}`,
      metadata: { scanId, planId },
      allow_promotion_codes: true,
    };

    // Link to existing customer or set email
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Add trial for weekly plan
    if (plan.trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: plan.trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
