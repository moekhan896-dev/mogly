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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  try {
    switch (event.type) {
      /* ── Checkout completed ── */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const scanId = session.metadata?.scanId;

        if (!customerId) break;

        // Always mark as premium on checkout completion
        await stripe.subscriptions.retrieve(subscriptionId);
        const status = "premium";

        // Find user by email or create mapping
        const customerEmail = session.customer_details?.email;

        if (customerEmail) {
          // Try to find existing profile by stripe_customer_id first
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (existingProfile) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: status,
                stripe_subscription_id: subscriptionId,
              })
              .eq("id", existingProfile.id);
          } else {
            // Try to find by auth email
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(
              (u) => u.email === customerEmail
            );

            if (authUser) {
              await supabase
                .from("profiles")
                .update({
                  subscription_status: status,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                })
                .eq("id", authUser.id);

              // Link scan to user if scanId provided
              if (scanId) {
                await supabase
                  .from("scans")
                  .update({ user_id: authUser.id })
                  .eq("id", scanId)
                  .is("user_id", null);
              }
            }
          }
        }
        break;
      }

      /* ── Subscription updated ── */
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        let status: string;
        if (sub.status === "active" || sub.status === "trialing") {
          status = "premium";
        } else if (sub.status === "past_due" || sub.status === "unpaid") {
          status = "premium"; // grace period
        } else {
          status = "cancelled";
        }

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_subscription_id: sub.id,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      /* ── Subscription deleted ── */
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      default:
        // Unhandled event type — just acknowledge
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    // Still return 200 so Stripe doesn't retry endlessly
  }

  return NextResponse.json({ received: true });
}
