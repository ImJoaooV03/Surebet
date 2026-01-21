/*
  # Enable RLS and Add Policies
  
  ## Query Description: 
  This migration enables Row Level Security (RLS) on all public tables to address security advisories.
  It defines policies so that:
  1. Authenticated users can read shared data (Events, Arbs, Odds, Books).
  2. Users can only read/write their own private data (Settings, Integrations).
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - RLS Status: Enabled for all tables.
  - Policy Changes: Yes, restrictive policies added.
*/

-- 1. Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;

-- 2. Policies for Shared/Public Data (Read-only for Authenticated Users)
-- These tables contain the betting data which is common for all users.
CREATE POLICY "Auth users can view books" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view sports" ON public.sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view leagues" ON public.leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view team_aliases" ON public.team_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view markets" ON public.markets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view odds" ON public.odds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);

-- 3. Policies for User Specific Data
-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Alerts (User specific history)
CREATE POLICY "Users can view own alerts" ON public.alerts 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Integrations
CREATE POLICY "Users can manage telegram" ON public.integrations_telegram 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage whatsapp" ON public.integrations_whatsapp 
  USING (auth.uid() = user_id);
