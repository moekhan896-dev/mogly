# CRITICAL FIXES CHECKLIST

## FIX 1 — Unlock button scrolls to paywall
- [ ] Add onClick handler to "Unlock" button
- [ ] Scroll to #paywall smoothly
- [ ] Add id="paywall" to paywall section

## FIX 2 — Treatment Protocol Step 1 visible (not blurred)
- [ ] Show Step 1 fully readable
- [ ] Steps 2-5 remain locked with blur
- [ ] Remove blur from step 1 only

## FIX 3 — Email capture copy update
- [ ] Update copy: "Get your free mini skin report"
- [ ] Subtitle: "We'll email your top 3 findings + 7-day reminder"
- [ ] Already saves to Supabase (done in V1)

## FIX 4 — Stripe checkout WITHOUT auth
- [ ] Remove auth check before checkout
- [ ] Direct to Stripe (no sign-in redirect)
- [ ] Stripe collects email during checkout
- [ ] Create Stripe products/prices if needed
- [ ] Set trial_period_days: 3 for weekly
- [ ] success_url: /results/{scanId}?upgraded=true
- [ ] cancel_url: /results/{scanId}

## FIX 5 — Supabase URL configuration (low priority)
- [ ] Set Site URL in Supabase Dashboard
- [ ] Add Redirect URLs
- [ ] Note: Auth now optional, not required

## FIX 6 — After payment success, unlock premium
- [ ] Check upgraded=true query parameter
- [ ] Unlock all premium content
- [ ] Remove blur-sm and lock emojis
- [ ] Show success banner

## FINAL
- [ ] Build passes
- [ ] Git commit + push
