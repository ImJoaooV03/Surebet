/*
  # Fix Duplicate Policies and Security Settings
  
  This migration resolves the "policy already exists" error by:
  1. Dropping existing policies to ensure a clean slate
  2. Re-enabling RLS on all tables
  3. Re-creating policies with correct permissions
  4. Fixing the function search_path security warning
*/

-- 1. Fix Function Search Path (Security Warning)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;

DROP POLICY IF EXISTS "Auth read events" ON public.events;
DROP POLICY IF EXISTS "Auth insert events" ON public.events;

DROP POLICY IF EXISTS "Auth read sports" ON public.sports;
DROP POLICY IF EXISTS "Auth insert sports" ON public.sports;

DROP POLICY IF EXISTS "Auth read leagues" ON public.leagues;
DROP POLICY IF EXISTS "Auth insert leagues" ON public.leagues;

DROP POLICY IF EXISTS "Auth read teams" ON public.teams;
DROP POLICY IF EXISTS "Auth insert teams" ON public.teams;

DROP POLICY IF EXISTS "Auth read books" ON public.books;
DROP POLICY IF EXISTS "Auth insert books" ON public.books;

DROP POLICY IF EXISTS "Auth read arbs" ON public.arbs;
DROP POLICY IF EXISTS "Auth insert arbs" ON public.arbs;

DROP POLICY IF EXISTS "Auth read arb_legs" ON public.arb_legs;
DROP POLICY IF EXISTS "Auth insert arb_legs" ON public.arb_legs;

-- 3. Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_legs ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Read Only Tables (Metadata) - Allow Insert for Simulator (Dev Mode)
CREATE POLICY "Auth read sports" ON public.sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert sports" ON public.sports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read leagues" ON public.leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert leagues" ON public.leagues FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read books" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);

-- Events & Arbs - Allow Insert for Simulator (Dev Mode)
CREATE POLICY "Auth read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert arbs" ON public.arbs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert arb_legs" ON public.arb_legs FOR INSERT TO authenticated WITH CHECK (true);
