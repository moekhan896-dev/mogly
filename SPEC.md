# Mogly — Complete Build Spec Reference

Saved from Art's Google Doc for reference during development.
See: ~/.openclaw/workspace/mogly/README.md for tech details.

## Key Decisions
- Ship date: Sunday March 23, 2026
- Launch: Monday March 24, 2026
- Target: $10K MRR in 30 days
- Pricing: $9.99/week (3-day trial), $29.99/mo, $99.99/yr
- Domain: getmogly.com (needs to be purchased)
- Design: Dark only, #0A0A12 bg, blush-free clinical aesthetic

## Stripe Products to Create
1. "Mogly Premium — Weekly" → $9.99/week recurring
2. "Mogly Premium — Monthly" → $29.99/month recurring
3. "Mogly Premium — Annual" → $99.99/year recurring
Copy price IDs to .env.local after creation.

## Supabase Setup
- Run supabase/migration.sql in SQL Editor
- Enable Google OAuth in Auth settings
- Storage bucket 'skin-photos' created by migration

## Vercel Deploy Checklist
- [ ] Push to GitHub
- [ ] Connect repo in Vercel
- [ ] Add all env vars (see .env.local.example)
- [ ] Set custom domain
- [ ] Configure Stripe webhook → https://domain/api/webhooks/stripe
- [ ] Test full flow end-to-end
