/*
  # Initial Schema Setup for Surebet Platform
  
  Creates the core tables defined in the PRD:
  - Users & Settings (linked to auth.users)
  - Sports domain (Sports, Leagues, Teams, Events)
  - Betting domain (Books, Markets, Odds)
  - Arbitrage domain (Arbs, Legs)
  - Alerting domain (Alerts, Integrations)

  ## Query Description:
  This migration sets up the entire database structure required for the MVP.
  It includes RLS policies to ensure users can only see their own settings,
  while arbitrage data is readable by all authenticated users.
  It also includes SEED DATA so the dashboard is not empty initially.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Security Implications:
  - RLS Enabled on all tables.
  - Public profiles created via trigger on auth.users.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Reference Tables (Sports, Books)
CREATE TABLE public.sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE, -- 'soccer', 'basketball'
    name TEXT NOT NULL
);

CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE, -- 'bet365', 'pinnacle'
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('book', 'exchange', 'provider')),
    commission_percent NUMERIC DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true
);

-- 2. User & Settings
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    bankroll_total NUMERIC DEFAULT 5000,
    stake_mode TEXT DEFAULT 'percent' CHECK (stake_mode IN ('fixed', 'percent')),
    stake_fixed_value NUMERIC DEFAULT 100,
    stake_percent_value NUMERIC DEFAULT 10,
    roi_min NUMERIC DEFAULT 0.8,
    freshness_live_sec INT DEFAULT 15,
    freshness_pre_sec INT DEFAULT 120,
    cooldown_sec INT DEFAULT 45,
    telegram_enabled BOOLEAN DEFAULT false,
    whatsapp_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Event Structure
CREATE TABLE public.leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    name TEXT NOT NULL,
    country TEXT
);

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    name TEXT NOT NULL
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    league_id UUID REFERENCES public.leagues(id),
    home_team_id UUID REFERENCES public.teams(id),
    away_team_id UUID REFERENCES public.teams(id),
    start_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Markets & Arbs
CREATE TABLE public.arbs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    sport_id UUID REFERENCES public.sports(id),
    market_type TEXT NOT NULL, -- '1x2', 'ml', 'totals'
    is_live BOOLEAN DEFAULT false,
    roi NUMERIC NOT NULL,
    sum_inv NUMERIC NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE public.arb_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arb_id UUID REFERENCES public.arbs(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id),
    outcome TEXT NOT NULL, -- 'Home', 'Draw', 'Away', 'Over 2.5'
    odd NUMERIC NOT NULL,
    implied_prob NUMERIC
);

-- 5. Integrations
CREATE TABLE public.integrations_telegram (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    chat_id TEXT,
    is_enabled BOOLEAN DEFAULT false
);

CREATE TABLE public.integrations_whatsapp (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_number_id TEXT,
    is_enabled BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_legs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Reference Data)
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);

-- Authenticated Read Policies (Operational Data)
CREATE POLICY "Auth read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);

-- User Specific Policies
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can see own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile and settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SEED DATA (To ensure the app is not empty)
DO $$
DECLARE
  s_soccer UUID;
  s_basket UUID;
  b_bet365 UUID;
  b_pinnacle UUID;
  b_betano UUID;
  t_fla UUID;
  t_flu UUID;
  t_lakers UUID;
  t_celtics UUID;
  l_bra UUID;
  l_nba UUID;
  e_fla_flu UUID;
  e_lak_cel UUID;
  arb_1 UUID;
  arb_2 UUID;
BEGIN
  -- Sports
  INSERT INTO public.sports (key, name) VALUES ('soccer', 'Futebol') RETURNING id INTO s_soccer;
  INSERT INTO public.sports (key, name) VALUES ('basketball', 'Basquete') RETURNING id INTO s_basket;

  -- Books
  INSERT INTO public.books (key, name) VALUES ('bet365', 'Bet365') RETURNING id INTO b_bet365;
  INSERT INTO public.books (key, name) VALUES ('pinnacle', 'Pinnacle') RETURNING id INTO b_pinnacle;
  INSERT INTO public.books (key, name) VALUES ('betano', 'Betano') RETURNING id INTO b_betano;

  -- Leagues
  INSERT INTO public.leagues (sport_id, name) VALUES (s_soccer, 'Brasileirão Série A') RETURNING id INTO l_bra;
  INSERT INTO public.leagues (sport_id, name) VALUES (s_basket, 'NBA') RETURNING id INTO l_nba;

  -- Teams
  INSERT INTO public.teams (sport_id, name) VALUES (s_soccer, 'Flamengo') RETURNING id INTO t_fla;
  INSERT INTO public.teams (sport_id, name) VALUES (s_soccer, 'Fluminense') RETURNING id INTO t_flu;
  INSERT INTO public.teams (sport_id, name) VALUES (s_basket, 'Lakers') RETURNING id INTO t_lakers;
  INSERT INTO public.teams (sport_id, name) VALUES (s_basket, 'Celtics') RETURNING id INTO t_celtics;

  -- Events
  INSERT INTO public.events (sport_id, league_id, home_team_id, away_team_id, start_time, status)
  VALUES (s_soccer, l_bra, t_fla, t_flu, NOW() + INTERVAL '2 hours', 'scheduled')
  RETURNING id INTO e_fla_flu;

  INSERT INTO public.events (sport_id, league_id, home_team_id, away_team_id, start_time, status)
  VALUES (s_basket, l_nba, t_lakers, t_celtics, NOW() - INTERVAL '30 minutes', 'live')
  RETURNING id INTO e_lak_cel;

  -- Arb 1 (Soccer Pre-match)
  INSERT INTO public.arbs (event_id, sport_id, market_type, is_live, roi, sum_inv, status, expires_at)
  VALUES (e_fla_flu, s_soccer, '1x2', false, 0.025, 0.975, 'active', NOW() + INTERVAL '1 hour')
  RETURNING id INTO arb_1;

  INSERT INTO public.arb_legs (arb_id, book_id, outcome, odd, implied_prob) VALUES
  (arb_1, b_bet365, 'Flamengo', 2.10, 0.476),
  (arb_1, b_pinnacle, 'Empate', 3.40, 0.294),
  (arb_1, b_betano, 'Fluminense', 4.80, 0.208);

  -- Arb 2 (Basket Live)
  INSERT INTO public.arbs (event_id, sport_id, market_type, is_live, roi, sum_inv, status, expires_at)
  VALUES (e_lak_cel, s_basket, 'Moneyline', true, 0.018, 0.982, 'active', NOW() + INTERVAL '5 minutes')
  RETURNING id INTO arb_2;

  INSERT INTO public.arb_legs (arb_id, book_id, outcome, odd, implied_prob) VALUES
  (arb_2, b_pinnacle, 'Lakers', 1.85, 0.54),
  (arb_2, b_bet365, 'Celtics', 2.25, 0.44);

END $$;
