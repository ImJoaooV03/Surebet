/*
  # Fix Schema and Enable Security
  
  1. Creates missing tables (team_aliases, integrations, etc.) if they don't exist.
  2. Enables Row Level Security (RLS) on all public tables.
  3. Sets up RLS policies for secure access.
  4. Creates a trigger to automatically create user_settings when a new user signs up.
  
  ## Impact
  - Safe to run: Uses IF NOT EXISTS checks.
  - Security: Enables RLS on all tables.
*/

-- 1. Ensure all tables exist (Idempotent)

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bankroll_total NUMERIC DEFAULT 1000,
  stake_mode TEXT DEFAULT 'percent', -- 'fixed' or 'percent'
  stake_fixed_value NUMERIC DEFAULT 50,
  stake_percent_value NUMERIC DEFAULT 1,
  roi_min NUMERIC DEFAULT 0.008,
  freshness_live_sec INT DEFAULT 15,
  freshness_pre_sec INT DEFAULT 120,
  cooldown_sec INT DEFAULT 45,
  min_leg_stake NUMERIC DEFAULT 10,
  max_leg_stake NUMERIC DEFAULT 10000,
  telegram_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'book',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID REFERENCES public.sports(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID REFERENCES public.sports(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID REFERENCES public.sports(id),
  league_id UUID REFERENCES public.leagues(id),
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.arbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  sport_id UUID REFERENCES public.sports(id),
  market_type TEXT NOT NULL,
  is_live BOOLEAN DEFAULT false,
  roi NUMERIC NOT NULL,
  sum_inv NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.arb_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arb_id UUID REFERENCES public.arbs(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id),
  outcome TEXT NOT NULL,
  odd NUMERIC NOT NULL,
  implied_prob NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_legs ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- User Settings: Users can only see/edit their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Public Read Access for Reference Data (Books, Sports, etc.)
DO $$ 
DECLARE 
  t text;
BEGIN 
  FOR t IN SELECT unnest(ARRAY['books', 'sports', 'leagues', 'teams', 'team_aliases', 'events', 'arbs', 'arb_legs']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- 4. User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
