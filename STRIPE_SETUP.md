# Stripe Configuration Guide

## Required Stripe Environment Variables

The checkout route expects these three environment variables:

```
STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx or sk_live_xxxxxxxxxxxxx
```

## How to Create Stripe Products & Prices

1. Go to https://dashboard.stripe.com/products
2. Click "+ Add product" for each:

### Product 1: Mogly Weekly
- Name: "Mogly Weekly"
- Description: "AI Skin Analysis - Weekly Subscription with 3-day free trial"
- Pricing: Recurring
  - Amount: $9.99
  - Frequency: Weekly
- After creating, copy the **Price ID** (starts with `price_`)

### Product 2: Mogly Monthly
- Name: "Mogly Monthly"
- Description: "AI Skin Analysis - Monthly Subscription"
- Pricing: Recurring
  - Amount: $29.99
  - Frequency: Monthly
- Copy the **Price ID**

### Product 3: Mogly Annual
- Name: "Mogly Annual"
- Description: "AI Skin Analysis - Annual Subscription (Save 15%)"
- Pricing: Recurring
  - Amount: $99.99
  - Frequency: Yearly
- Copy the **Price ID**

## Setting Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add each variable:
   - Key: `STRIPE_WEEKLY_PRICE_ID`, Value: `price_xxxxxxxxxxxxx`
   - Key: `STRIPE_MONTHLY_PRICE_ID`, Value: `price_xxxxxxxxxxxxx`
   - Key: `STRIPE_ANNUAL_PRICE_ID`, Value: `price_xxxxxxxxxxxxx`
   - Key: `STRIPE_SECRET_KEY`, Value: `sk_test_xxxxxxxxxxxxx` (or sk_live_)

4. After adding, **REDEPLOY** your project for changes to take effect

## Testing Stripe Locally

For local testing, add these to your `.env.local` file (DO NOT commit):

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
```

Then restart your dev server: `npm run dev`
