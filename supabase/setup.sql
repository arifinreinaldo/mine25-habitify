-- Habitify Database Setup
-- Run this entire script in Supabase SQL Editor (supabase.com → SQL Editor → New Query)

-- 1. TABLES
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📝',
  color TEXT DEFAULT '#6366f1',
  time_of_day TEXT DEFAULT 'anytime' CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'anytime')),
  frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
  frequency_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  frequency_target INTEGER,
  reminder_time TIME,
  is_archived BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_at)
);

-- 2. INDEXES (faster queries)
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_completions_user_date ON completions(user_id, completed_at);
CREATE INDEX idx_completions_habit_id ON completions(habit_id);

-- 3. ROW LEVEL SECURITY
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own completions" ON completions FOR ALL USING (auth.uid() = user_id);
