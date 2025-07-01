-- Enhanced Mental Health Dashboard SQL Schema
-- Run this in your Supabase SQL Editor to add new features

-- Mood tracking table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  mood_label TEXT, -- e.g., 'happy', 'anxious', 'calm', 'stressed'
  notes TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness check-ins table
CREATE TABLE IF NOT EXISTS wellness_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'custom'
  overall_wellbeing INTEGER CHECK (overall_wellbeing >= 1 AND overall_wellbeing <= 10),
  physical_health INTEGER CHECK (physical_health >= 1 AND physical_health <= 10),
  mental_health INTEGER CHECK (mental_health >= 1 AND mental_health <= 10),
  social_connections INTEGER CHECK (social_connections >= 1 AND social_connections <= 10),
  work_life_balance INTEGER CHECK (work_life_balance >= 1 AND work_life_balance <= 10),
  gratitude_notes TEXT,
  challenges TEXT,
  goals_met BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals and achievements table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'mental_health', 'physical_health', 'social', 'personal_growth'
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- 'days', 'sessions', 'hours', 'count'
  target_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking for goals
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  progress_value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources library
CREATE TABLE IF NOT EXISTS mental_health_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'article', 'video', 'podcast', 'exercise', 'meditation', 'crisis'
  content_type TEXT, -- 'internal', 'external_link', 'file'
  url TEXT,
  file_path TEXT,
  content TEXT, -- For internal content
  tags TEXT[], -- Array of tags for filtering
  difficulty_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  estimated_duration INTEGER, -- In minutes
  is_featured BOOLEAN DEFAULT false,
  is_crisis_resource BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's saved resources
CREATE TABLE IF NOT EXISTS user_saved_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES mental_health_resources(id) ON DELETE CASCADE,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT, -- 'personal', 'professional', 'crisis_hotline'
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group activity feed
CREATE TABLE IF NOT EXISTS group_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT, -- 'joined', 'message', 'achievement', 'check_in', 'goal_completed'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Flexible data storage for different activity types
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer connections/support network
CREATE TABLE IF NOT EXISTS peer_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  peer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'support_buddy', -- 'support_buddy', 'mentor', 'mentee'
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
  shared_groups TEXT[], -- Array of group IDs they share
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, peer_id)
);

-- Support sessions/appointments
CREATE TABLE IF NOT EXISTS support_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT, -- 'therapy', 'group_meeting', 'peer_support', 'crisis_intervention'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default crisis resources
INSERT INTO mental_health_resources (title, description, category, content_type, url, tags, is_crisis_resource, is_featured)
VALUES 
  ('National Suicide Prevention Lifeline', 'Free, confidential support 24/7 for people in distress', 'crisis', 'external_link', 'tel:988', ARRAY['crisis', 'suicide', 'emergency'], true, true),
  ('Crisis Text Line', 'Text HOME to 741741 to reach a volunteer Crisis Counselor', 'crisis', 'external_link', 'sms:741741', ARRAY['crisis', 'text', 'emergency'], true, true),
  ('SAMHSA National Helpline', 'Treatment referral and information service', 'crisis', 'external_link', 'tel:1-800-662-4357', ARRAY['crisis', 'treatment', 'referral'], true, true),
  ('Mindful Breathing Exercise', '5-minute breathing exercise to reduce anxiety', 'exercise', 'internal', '', ARRAY['breathing', 'anxiety', 'meditation'], false, true),
  ('Progressive Muscle Relaxation', 'Systematic muscle relaxation technique', 'exercise', 'internal', '', ARRAY['relaxation', 'stress', 'physical'], false, true)
ON CONFLICT DO NOTHING;

-- Update content for internal resources
UPDATE mental_health_resources 
SET content = '**5-Minute Mindful Breathing Exercise**

1. Find a comfortable seated position
2. Close your eyes or soften your gaze
3. Take a deep breath in through your nose for 4 counts
4. Hold your breath for 4 counts
5. Exhale slowly through your mouth for 6 counts
6. Repeat this cycle for 5 minutes
7. Notice how your body feels when finished

*This exercise can help reduce anxiety and promote calm.*'
WHERE title = 'Mindful Breathing Exercise';

UPDATE mental_health_resources 
SET content = '**Progressive Muscle Relaxation**

Starting from your toes and working up:

1. **Feet**: Tense your feet for 5 seconds, then relax
2. **Calves**: Tense your calf muscles, then relax
3. **Thighs**: Tense your thigh muscles, then relax
4. **Hands**: Make fists, tense for 5 seconds, then relax
5. **Arms**: Tense your arm muscles, then relax
6. **Shoulders**: Raise shoulders to ears, then relax
7. **Face**: Scrunch facial muscles, then relax

Take a moment to notice the difference between tension and relaxation.'
WHERE title = 'Progressive Muscle Relaxation';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_user_date ON wellness_checkins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status ON user_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_activities_group_date ON group_activities(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_peer_connections_user ON peer_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_support_sessions_user_date ON support_sessions(user_id, scheduled_at);

-- Row Level Security (RLS) policies
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own mood entries" ON mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood entries" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood entries" ON mood_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wellness checkins" ON wellness_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wellness checkins" ON wellness_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wellness checkins" ON wellness_checkins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view goal progress" ON goal_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_goals WHERE user_goals.id = goal_progress.goal_id AND (user_goals.user_id = auth.uid() OR user_goals.is_public = true))
);
CREATE POLICY "Users can insert goal progress" ON goal_progress FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_goals WHERE user_goals.id = goal_progress.goal_id AND user_goals.user_id = auth.uid())
);

CREATE POLICY "Everyone can view mental health resources" ON mental_health_resources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own saved resources" ON user_saved_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved resources" ON user_saved_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved resources" ON user_saved_resources FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emergency contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emergency contacts" ON emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency contacts" ON emergency_contacts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view public group activities" ON group_activities FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own group activities" ON group_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own peer connections" ON peer_connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = peer_id);
CREATE POLICY "Users can insert own peer connections" ON peer_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own peer connections" ON peer_connections FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = peer_id);

CREATE POLICY "Users can view own support sessions" ON support_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own support sessions" ON support_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support sessions" ON support_sessions FOR UPDATE USING (auth.uid() = user_id);
