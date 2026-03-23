# PROMPT 2 — DASHBOARD + RETENTION CHECKLIST

## 1. Create /dashboard page
- [ ] Server component fetches user + latest scan
- [ ] Shows streak (🔥 prominent)
- [ ] Shows latest scan card with thumbnail + score
- [ ] "📸 New Scan" button (green gradient)
- [ ] Redirect logged-in users here from landing

## 2. Scan History / Photo Library
- [ ] Query all scans for user
- [ ] Show thumbnails + scores + dates
- [ ] Show score change vs previous (+/-)
- [ ] Tap to view full results

## 3. Daily Routine Checklist
- [ ] Create routine_completions table
- [ ] Dashboard shows checkboxes for improvement_plan steps
- [ ] Track 3/5 completed today
- [ ] Reset each day
- [ ] Green checkmark animation

## 4. Streak System
- [ ] Create user_streaks table (if not exists)
- [ ] Check last_active on dashboard load
- [ ] Increment streak if yesterday, reset if older
- [ ] Show on dashboard

## 5. Skin Coach Chat
- [ ] Create /coach page
- [ ] Create /api/coach endpoint
- [ ] Get user's latest scan server-side
- [ ] Send to Gemini with context
- [ ] Show preset questions
- [ ] No login redirect if already logged in

## 6. Daily Routine Page
- [ ] Create /routine page
- [ ] ☀️ Morning routine (steps 1-3)
- [ ] 🌙 Evening routine (steps 4-5)
- [ ] Recommended products
- [ ] Checkboxes sync with dashboard

## 7. Link Scans to User Accounts
- [ ] Update scan.user_id when account created
- [ ] Save user_id for new scans

## 8. Bottom Navigation Bar
- [ ] Create BottomNav component
- [ ] 4 tabs: Scan, Routine, Coach, Profile
- [ ] Show on dashboard/routine/coach/results
- [ ] Highlight active tab

## FINAL
- [ ] Build passes
- [ ] Git commit + push
