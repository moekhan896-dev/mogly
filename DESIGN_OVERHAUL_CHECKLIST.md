# DESIGN OVERHAUL CHECKLIST

## 1. ANIMATED PARTICLE BACKGROUND
- [ ] Create ParticleBackground.tsx component
- [ ] 40-60 dots (mobile: 25), 1-2px, rgba(0,229,160,0.15)
- [ ] Lines between dots within 120px, rgba(0,229,160,0.05)
- [ ] 0.2-0.5px/frame movement
- [ ] Canvas fixed, inset:0, z-index:0, pointer-events:none
- [ ] requestAnimationFrame 60fps
- [ ] Add to global layout

## 2. SCANNING ANIMATION OVERHAUL
- [ ] Show uploaded photo in center
- [ ] Horizontal green sweep line (3s, infinite)
- [ ] 6 marker dots at face positions with pulse
- [ ] Connecting lines between dots
- [ ] Sequential labels: PORE DENSITY, MELANIN, COLLAGEN, HYDRATION, INFLAMMATION, ELASTICITY
- [ ] Cycling analysis text (4-8s)

## 3. ADD "SKIN AGE" TO RESULTS
- [ ] Update AI prompt schema to include skin_age
- [ ] Add system prompt guidance for skin age calculation
- [ ] Add skin_age field to ScanResult type
- [ ] Display skin age badge in ResultsClient
- [ ] Color: green if younger, amber if older

## 4. CLINICAL TYPOGRAPHY OVERHAUL
- [ ] Update results page labels
- [ ] Update sub-score labels
- [ ] Update loading screen text
- [ ] Search & replace throughout codebase

## 5. SCORE NUMBER REVEAL ANIMATION
- [ ] Update AnimatedScore component
- [ ] 1.5s random number cycling (50ms intervals)
- [ ] 0.5s slow-down to final number
- [ ] Sonar ping ring animation on land

## 6. FACE SCAN SCREEN WITH GRID OVERLAY
- [ ] Add subtle green grid/mesh overlay (8% opacity)
- [ ] Corner brackets around viewfinder
- [ ] Text: "Position face within frame • Good lighting required"
- [ ] Subtitle: "AI will analyze 10 skin health dimensions"

## 7. SUB-SCORES WITH CONNECTING LINES
- [ ] Add subtle lines between cards (rgba(255,255,255,0.04))
- [ ] Add icons before each label (✦, ◐, ⊞, ◇, ◎, ◈)
- [ ] Keep clinical (text, not emoji)

## 8. RESULTS CARD HEADER WITH FACE OUTLINE
- [ ] Add 64x64px circular avatar area at top
- [ ] Use scan photo or face silhouette
- [ ] Thin green border ring
- [ ] Position above MOGLY SKIN ANALYSIS

## FINAL
- [ ] Build passes
- [ ] Git commit + push
