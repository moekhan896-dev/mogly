# V1.1 RETENTION UPDATE CHECKLIST

## 1. DAILY STREAK COUNTER
- [ ] Create user_streaks table migration
- [ ] Add streak logic to results page
- [ ] Display "🔥 {streak} day streak" on results
- [ ] Track last_active and reset if >1 day gap

## 2. DAILY SKIN ROUTINE CHECKLIST (Premium)
- [ ] Create /dashboard page
- [ ] Show current score (small)
- [ ] Display improvement_plan steps as checklist
- [ ] Checkbox state with checkmark animation
- [ ] "X/5 steps completed today"
- [ ] localStorage persistence
- [ ] Reset at midnight

## 3. SKIN COACH CHAT (Premium)
- [ ] Create /coach page
- [ ] Create /api/coach endpoint with Gemini
- [ ] Chat interface with messages
- [ ] Text input at bottom
- [ ] 4 preset question buttons
- [ ] System prompt with user's skin context

## 4. PROGRESS TRACKING (Premium)
- [ ] Compare previous → current score
- [ ] Show +/- points with emoji
- [ ] Line chart for 3+ scans (recharts)
- [ ] Verify ScoreHistory component renders
- [ ] "Re-scan" button at bottom

## 5. DRAMATIC SCAN SCREEN
- [ ] Grid/mesh SVG overlay on viewfinder
- [ ] Corner bracket markers
- [ ] Scanning line animation
- [ ] Larger capture button (72px)
- [ ] Pulsing green glow
- [ ] Updated subtitle text

## FINAL
- [ ] Build passes
- [ ] Git commit + push
