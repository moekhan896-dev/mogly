# Mogly — AI Skin Score

AI-powered skin analysis app. Upload a selfie, get your Mogly Score (0-100) with detailed breakdowns.

## Tech Stack

- **Frontend:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS (dark mode only)
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** OpenAI GPT-4o Vision
- **Payments:** Stripe Subscriptions
- **Hosting:** Vercel
- **Analytics:** PostHog (optional)

## Quick Start

```bash
# Install
npm install --include=dev

# Copy env vars
cp .env.local.example .env.local
# Fill in your actual keys

# Run database migration in Supabase Dashboard
# → SQL Editor → paste supabase/migration.sql → Run

# Dev server
npm run dev
```

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (secret!) |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_WEEKLY_PRICE_ID` | Create in Stripe → Products |
| `STRIPE_MONTHLY_PRICE_ID` | Create in Stripe → Products |
| `STRIPE_ANNUAL_PRICE_ID` | Create in Stripe → Products |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL or custom domain |

## Stripe Setup

1. Create a product "Mogly Premium" in Stripe Dashboard
2. Add 3 prices:
   - $9.99/week (recurring)
   - $29.99/month (recurring)
   - $99.99/year (recurring)
3. Copy each price ID to `.env.local`
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
5. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link & deploy
vercel --yes --prod
```

Add all env vars in Vercel Dashboard → Settings → Environment Variables.

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── scan/page.tsx               # Onboarding quiz (4 questions)
├── scan/capture/page.tsx       # Camera/upload screen
├── results/[id]/page.tsx       # Results card (THE viral screen)
├── auth/page.tsx               # Sign in/up
├── account/page.tsx            # Subscription management
├── privacy/page.tsx            # Privacy policy
├── terms/page.tsx              # Terms of service
├── api/analyze/route.ts        # GPT-4o Vision analysis
├── api/checkout/route.ts       # Stripe Checkout sessions
├── api/portal/route.ts         # Stripe Customer Portal
└── api/webhooks/stripe/route.ts # Stripe webhook handler

components/results/
├── AnimatedScore.tsx           # Count-up score animation
├── SubScoresGrid.tsx           # 3x2 sub-score grid
├── ShareButton.tsx             # PNG card generator + share
├── Paywall.tsx                 # Pricing cards + auth gate
├── PremiumContent.tsx          # Conditions, fix plan, recs
└── ScoreHistory.tsx            # Line chart for returning users

lib/
├── supabase.ts                 # Browser client
├── supabase-server.ts          # Server client (cookies)
├── subscription.ts             # isSubscribed() utility
├── stripe.ts                   # Server Stripe + plans config
├── stripe-client.ts            # Client-side loadStripe
├── openai.ts                   # OpenAI client
├── scores.ts                   # Score colors, types
└── analytics.ts                # Event tracking
```
