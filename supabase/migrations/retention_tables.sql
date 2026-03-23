-- Routine completions tracking table
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  completed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_number, completed_date)
);

-- Enable RLS
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users see only their own completions
CREATE POLICY "Users see own routine completions" ON routine_completions
  FOR ALL
  USING (auth.uid() = user_id);

-- User streaks table (update the existing one if it exists)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 1,
  last_active DATE DEFAULT CURRENT_DATE,
  longest_streak INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users see only their own streaks
CREATE POLICY "Users see own streaks" ON user_streaks
  FOR ALL
  USING (auth.uid() = user_id);
