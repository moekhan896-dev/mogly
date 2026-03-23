# Stripe Configuration Guide

## Your Stripe Price IDs (READY TO USE ✅)

```
STRIPE_WEEKLY_PRICE_ID=price_1TDwMnH6HtFUM3kP4JiP5DNA
STRIPE_MONTHLY_PRICE_ID=price_1TDwNpH6HtFUM3kPPMfnqHYY
STRIPE_ANNUAL_PRICE_ID=price_1TDwOXH6HtFUM3kPKoWMCfVp
```

## Setting Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project (Mogly)
2. Settings → Environment Variables
3. Add each variable:
   - Key: `STRIPE_WEEKLY_PRICE_ID`, Value: `price_1TDwMnH6HtFUM3kP4JiP5DNA`
   - Key: `STRIPE_MONTHLY_PRICE_ID`, Value: `price_1TDwNpH6HtFUM3kPPMfnqHYY`
   - Key: `STRIPE_ANNUAL_PRICE_ID`, Value: `price_1TDwOXH6HtFUM3kPKoWMCfVp`
   - Key: `STRIPE_SECRET_KEY`, Value: `sk_test_xxxxxxxxxxxxx` (or sk_live_ if production)

4. After adding, **REDEPLOY** your project for changes to take effect:
   - Click "Deployments" tab
   - Find the latest deployment
   - Click the "..." menu
   - Select "Redeploy"

## Local Testing

For local testing, create `.env.local` (DO NOT commit):

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEEKLY_PRICE_ID=price_1TDwMnH6HtFUM3kP4JiP5DNA
STRIPE_MONTHLY_PRICE_ID=price_1TDwNpH6HtFUM3kPPMfnqHYY
STRIPE_ANNUAL_PRICE_ID=price_1TDwOXH6HtFUM3kPKoWMCfVp
```

Then restart: `npm run dev`

## Testing the Checkout Flow

After deployment:
1. Go to `/scan` and take a test scan
2. Click "Start Free Trial" button
3. Should redirect to Stripe Checkout
4. Use test card: `4242 4242 4242 4242` (any future exp date, any CVC)
5. Should redirect back to results with `?upgraded=true`
6. Premium content should be unlocked ✅

