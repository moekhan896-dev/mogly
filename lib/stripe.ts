import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

// Pricing config
export const PLANS = {
  weekly: {
    name: "Mogly Premium — Weekly",
    price: "$9.99/week",
    priceId: process.env.STRIPE_WEEKLY_PRICE_ID!,
    trialDays: 3,
  },
  monthly: {
    name: "Mogly Premium — Monthly",
    price: "$29.99/month",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    trialDays: 0,
  },
  annual: {
    name: "Mogly Premium — Annual",
    price: "$99.99/year",
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    trialDays: 0,
  },
} as const;
