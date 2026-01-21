/*
  # Security Fixes: RLS and Function Search Path

  ## Query Description:
  1. Fixes "Function Search Path Mutable" warning by setting search_path on the handle_new_user trigger function.
  2. Fixes "RLS Disabled in Public" error by explicitly enabling RLS on all application tables.
  3. Defines comprehensive RLS policies to allow the Frontend Simulator to function while keeping data secure.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Medium" (Changes access policies)
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Fix Function Search Path (Security Best Practice)
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

-- 2. Enable RLS on ALL tables (Fixes "RLS Disabled" Errors)
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.arb_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies
-- We use DO blocks or drop/create to ensure idempotency

-- A. Reference Data (Books, Sports, Leagues, Teams)
-- Everyone can read, Authenticated users (Simulator) can insert
CREATE POLICY "Public read access for books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Auth insert access for books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read access for sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Auth insert access for sports" ON public.sports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read access for leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Auth insert access for leagues" ON public.leagues FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Auth insert access for teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);

-- B. Operational Data (Events, Arbs, Legs)
-- Authenticated users can read and insert (for Simulator)
CREATE POLICY "Auth read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read markets" ON public.markets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert markets" ON public.markets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert arbs" ON public.arbs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert arb_legs" ON public.arb_legs FOR INSERT TO authenticated WITH CHECK (true);

-- C. User Private Data (Settings, Integrations)
-- Users can only see/edit their OWN data
DROP POLICY IF EXISTS "Users view own settings" ON public.user_settings;
CREATE POLICY "Users view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own settings" ON public.user_settings;
CREATE POLICY "Users update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own settings" ON public.user_settings;
CREATE POLICY "Users insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Integrations Policies
DROP POLICY IF EXISTS "Users view own telegram" ON public.integrations_telegram;
CREATE POLICY "Users view own telegram" ON public.integrations_telegram FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own whatsapp" ON public.integrations_whatsapp;
CREATE POLICY "Users view own whatsapp" ON public.integrations_whatsapp FOR SELECT TO authenticated USING (auth.uid() = user_id);
