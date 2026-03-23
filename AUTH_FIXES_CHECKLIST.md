# AUTH SYSTEM FIXES CHECKLIST

## 1. Email/Password Authentication
- [ ] Fix sign-up (supabase.auth.signUp)
- [ ] Fix sign-in (supabase.auth.signInWithPassword)
- [ ] Add error message display
- [ ] Fix loading button state
- [ ] Add confirmation message
- [ ] Redirect to /dashboard on success

## 2. Supabase Email Confirmation
- [ ] Disable "Confirm email" in Supabase
- [ ] Set Site URL to Vercel domain
- [ ] Add redirect URLs

## 3. Google OAuth
- [ ] Hide Google button (option B - no setup needed)

## 4. Post-Payment Auth Flow
- [ ] Show account creation modal after ?upgraded=true
- [ ] Email + password inputs
- [ ] Save Stripe customer_id to profiles table
- [ ] Link subscription to user profile

## 5. Clean Premium Results Page
- [ ] Hide locked sections when premium
- [ ] Remove blur-sm classes
- [ ] Remove lock emojis
- [ ] Hide "Unlock" button when premium
- [ ] Hide locked steps when premium
- [ ] Hide paywall when premium
- [ ] Hide email capture when premium

## FINAL
- [ ] Build passes
- [ ] Git commit + push
