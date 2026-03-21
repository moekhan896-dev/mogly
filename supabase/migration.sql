-- ============================================
-- MOGLY — Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  skin_concern TEXT CHECK (skin_concern IN ('acne', 'aging', 'dryness', 'oiliness', 'redness', 'dark_spots')),
  age_range TEXT CHECK (age_range IN ('under_18', '18-24', '25-34', '35-44', '45+')),
  routine_level TEXT CHECK (routine_level IN ('none', 'basic', 'moderate', 'advanced')),
  goal TEXT CHECK (goal IN ('clear_skin', 'anti_aging', 'glow', 'even_tone')),
  subscription_status TEXT DEFAULT 'free' NOT NULL CHECK (subscription_status IN ('free', 'trial', 'active', 'cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';

-- ============================================
-- 2. SCANS TABLE
-- ============================================
CREATE TABLE public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- nullable for anonymous scans
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  image_url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
  glow_score INTEGER CHECK (glow_score BETWEEN 0 AND 100),
  texture_score INTEGER CHECK (texture_score BETWEEN 0 AND 100),
  hydration_score INTEGER CHECK (hydration_score BETWEEN 0 AND 100),
  evenness_score INTEGER CHECK (evenness_score BETWEEN 0 AND 100),
  firmness_score INTEGER CHECK (firmness_score BETWEEN 0 AND 100),
  percentile INTEGER CHECK (percentile BETWEEN 1 AND 100),
  conditions JSONB DEFAULT '[]'::jsonb,
  score_killer TEXT,
  improvement_plan JSONB DEFAULT '[]'::jsonb,
  product_recs JSONB DEFAULT '[]'::jsonb,
  dietary_triggers JSONB DEFAULT '[]'::jsonb,
  raw_ai_response JSONB,
  onboarding_data JSONB  -- stores quiz answers: { concern, ageRange, routineLevel, goal }
);

COMMENT ON TABLE public.scans IS 'Skin analysis results from AI scoring';

-- Index for fast user scan lookups + ordering
CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);

-- ============================================
-- 3. SHARES TABLE
-- ============================================
CREATE TABLE public.shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  platform TEXT  -- e.g. 'instagram', 'tiktok', 'twitter', 'copy_link', 'download'
);

COMMENT ON TABLE public.shares IS 'Tracks when users share their score cards';

CREATE INDEX idx_shares_scan_id ON public.shares(scan_id);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read/update only their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SCANS: users can read their own scans
CREATE POLICY "Users can read own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

-- SCANS: anonymous scans readable by anyone with the scan ID (for share links)
-- We use a permissive policy — anonymous scans (user_id IS NULL) are public
CREATE POLICY "Anonymous scans are publicly readable"
  ON public.scans FOR SELECT
  USING (user_id IS NULL);

-- SCANS: allow inserts from authenticated users for their own scans
CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- SCANS: service role inserts (API routes use service key, bypasses RLS)
-- No extra policy needed — service_role bypasses RLS by default

-- SHARES: anyone can insert a share record (tracks sharing)
CREATE POLICY "Anyone can insert shares"
  ON public.shares FOR INSERT
  WITH CHECK (true);

-- SHARES: anyone can read shares (for analytics)
CREATE POLICY "Anyone can read shares"
  ON public.shares FOR SELECT
  USING (true);

-- ============================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
-- Trigger: when a new auth.users row is created, auto-insert a profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. STORAGE BUCKET — skin-photos
-- ============================================
-- Create private bucket for selfie uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skin-photos',
  'skin-photos',
  false,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Authenticated users can upload to their own folder: skin-photos/{user_id}/*
CREATE POLICY "Auth users upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'skin-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own photos
CREATE POLICY "Auth users read own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'skin-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anonymous uploads go to skin-photos/anonymous/*
-- Uses anon key — Supabase anon role
CREATE POLICY "Anon users upload to anonymous folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'skin-photos'
    AND (storage.foldername(name))[1] = 'anonymous'
  );

-- Allow reading anonymous photos (needed for AI analysis API)
CREATE POLICY "Anon photos are readable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'skin-photos'
    AND (storage.foldername(name))[1] = 'anonymous'
  );

-- ============================================
-- DONE. Verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--   SELECT * FROM storage.buckets WHERE id = 'skin-photos';
-- ============================================
