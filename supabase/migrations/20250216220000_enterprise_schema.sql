-- ENTERPRISE SCHEMA MIGRATION
-- Resetting public schema to ensure clean slate for the new architecture
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & SETTINGS
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    bankroll_total NUMERIC DEFAULT 1500,
    stake_mode TEXT DEFAULT 'percent' CHECK (stake_mode IN ('fixed', 'percent')),
    stake_fixed_value NUMERIC DEFAULT 500,
    stake_percent_value NUMERIC DEFAULT 10,
    roi_min NUMERIC DEFAULT 0.008,
    freshness_live_sec INT DEFAULT 15,
    freshness_pre_sec INT DEFAULT 120,
    cooldown_sec INT DEFAULT 45,
    min_leg_stake NUMERIC DEFAULT 10,
    max_leg_stake NUMERIC DEFAULT 10000,
    channels JSONB DEFAULT '{"telegram": false, "whatsapp": false}'::jsonb
);

-- 2. INTEGRATIONS
CREATE TABLE public.integrations_telegram (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    chat_id TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, chat_id)
);

CREATE TABLE public.integrations_whatsapp (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    to_number TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, to_number)
);

-- 3. CORE DOMAIN (Sports, Leagues, Teams)
CREATE TABLE public.sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL, -- 'soccer', 'basketball'
    name TEXT NOT NULL
);

CREATE TABLE public.leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    name TEXT NOT NULL,
    provider_keys JSONB DEFAULT '{}'::jsonb -- { "opticodds": "...", "uof": "..." }
);

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    name TEXT NOT NULL,
    provider_keys JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.team_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    alias TEXT NOT NULL
);
CREATE INDEX idx_team_aliases_alias ON public.team_aliases(lower(alias));

CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'book' CHECK (type IN ('book', 'exchange', 'provider')),
    commission_percent NUMERIC DEFAULT 0,
    region TEXT,
    currency TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    provider_key TEXT UNIQUE -- OpticOdds ID
);

-- 4. EVENTS & ODDS
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES public.sports(id),
    league_id UUID REFERENCES public.leagues(id),
    start_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    home_team_id UUID REFERENCES public.teams(id),
    away_team_id UUID REFERENCES public.teams(id),
    score_home INT,
    score_away INT,
    provider_keys JSONB DEFAULT '{}'::jsonb,
    last_update_ts TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_status ON public.events(status);

CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    market_type TEXT NOT NULL, -- 'soccer_1x2_90', 'basket_ml'
    rule_set TEXT DEFAULT 'standard',
    line_value NUMERIC,
    provider_keys JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_markets_event ON public.markets(event_id);

CREATE TABLE public.odds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id),
    outcome_key TEXT NOT NULL, -- 'HOME', 'AWAY', 'DRAW', 'OVER', 'UNDER'
    odd_value NUMERIC NOT NULL,
    ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_odds_market_ts ON public.odds(market_id, ts DESC);
CREATE INDEX idx_odds_book_ts ON public.odds(book_id, ts DESC);

-- 5. ARBITRAGE ENGINE
CREATE TABLE public.arbs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'sent')),
    sum_inv NUMERIC NOT NULL,
    roi NUMERIC NOT NULL,
    signature TEXT UNIQUE, -- Hash for deduplication
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_arbs_status ON public.arbs(status);

CREATE TABLE public.arb_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arb_id UUID REFERENCES public.arbs(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id),
    outcome_key TEXT NOT NULL,
    odd_value NUMERIC NOT NULL,
    stake_value NUMERIC,
    payout_est NUMERIC
);

CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arb_id UUID REFERENCES public.arbs(id),
    user_id UUID REFERENCES public.users(id),
    channel TEXT CHECK (channel IN ('telegram', 'whatsapp')),
    payload_json JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_status TEXT DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'failed')),
    error_msg TEXT
);

-- 6. SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for WebContainer Demo - In Prod, restrict writes to Service Role)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public Read Access for Core Data
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public read odds" ON public.odds FOR SELECT USING (true);

-- Arbs: Authenticated users can read
CREATE POLICY "Auth read arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);

-- Alerts: Own data only
CREATE POLICY "Own alerts" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ALLOW INSERT FOR DEMO (In production, only backend worker should insert)
CREATE POLICY "Demo Insert Events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Demo Insert Markets" ON public.markets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Demo Insert Odds" ON public.odds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Demo Insert Arbs" ON public.arbs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Demo Insert Legs" ON public.arb_legs FOR INSERT TO authenticated WITH CHECK (true);

-- 7. TRIGGERS
-- Auto-create user profile and settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA (Essential for the system to not look empty)
INSERT INTO public.sports (key, name) VALUES 
('soccer', 'Futebol'),
('basketball', 'Basquete')
ON CONFLICT DO NOTHING;

INSERT INTO public.books (name, type, provider_key) VALUES
('Bet365', 'book', 'bet365'),
('Pinnacle', 'book', 'pinnacle'),
('Betano', 'book', 'betano'),
('1xBet', 'book', '1xbet'),
('Betfair', 'exchange', 'betfair')
ON CONFLICT DO NOTHING;
