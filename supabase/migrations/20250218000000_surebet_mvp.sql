-- MIGRATION: SUREBET MVP ARCHITECTURE
-- Objetivo: Suporte a API-SPORTS, Budget por esporte e Engine de Arbitragem

-- 1. App Settings (Configurações Globais e Segredos)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id int PRIMARY KEY DEFAULT 1,
    apisports_key text, -- Armazenado aqui, não no ENV do frontend
    cron_token text,    -- Token para proteger endpoints de cron
    sports_enabled jsonb DEFAULT '{"football": true, "basketball": true}'::jsonb,
    roi_min_pre numeric DEFAULT 0.008,  -- 0.8%
    roi_min_live numeric DEFAULT 0.015, -- 1.5%
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Garante que a linha 1 exista
INSERT INTO public.app_settings (id, cron_token)
VALUES (1, md5(random()::text))
ON CONFLICT (id) DO NOTHING;

-- 2. Request Budget (Controle de Cota da API)
CREATE TABLE IF NOT EXISTS public.request_budget (
    day date NOT NULL,
    sport_key text NOT NULL, -- 'football', 'basketball'
    used int DEFAULT 0,
    PRIMARY KEY (day, sport_key)
);

-- 3. Events (Jogos/Fixtures)
CREATE TABLE IF NOT EXISTS public.events (
    id bigserial PRIMARY KEY,
    sport_key text NOT NULL,
    provider_event_id text NOT NULL, -- ID da API-Sports
    league_id text,
    start_time_utc timestamptz NOT NULL,
    home_name text NOT NULL,
    away_name text NOT NULL,
    status text DEFAULT 'scheduled', -- scheduled, live, finished
    score_json jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(sport_key, provider_event_id)
);

-- 4. Event Queue (Fila de Prioridade para buscar Odds)
CREATE TABLE IF NOT EXISTS public.event_queue (
    event_id bigint PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
    bucket text NOT NULL, -- LIVE, PRE_HOT, PRE_MID, PRE_LONG
    priority_score int DEFAULT 0,
    last_odds_fetch_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

-- 5. Odds Snapshots (Histórico recente de odds para double-check)
CREATE TABLE IF NOT EXISTS public.odds_snapshots (
    event_id bigint PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
    snapshot_hash text NOT NULL, -- Hash para detectar mudanças
    snapshot_json jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 6. Opportunities (Surebets detectadas)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id bigserial PRIMARY KEY,
    event_id bigint REFERENCES public.events(id) ON DELETE CASCADE,
    sport_key text NOT NULL,
    bucket text NOT NULL,
    market_key text NOT NULL, -- 'match_winner', 'totals', etc
    line_value text,          -- '2.5', '0.0', null
    period text DEFAULT 'FT',
    include_ot boolean DEFAULT false,
    roi numeric NOT NULL,
    legs_json jsonb NOT NULL, -- [{bookmaker, outcome, odd, stake_percent}]
    created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time_utc);
CREATE INDEX IF NOT EXISTS idx_queue_bucket ON public.event_queue(bucket);
CREATE INDEX IF NOT EXISTS idx_opps_roi ON public.opportunities(roi DESC);
CREATE INDEX IF NOT EXISTS idx_opps_created ON public.opportunities(created_at DESC);

-- RLS (Segurança Básica)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Políticas:
-- Backend (Service Role) tem acesso total (bypass RLS).
-- Frontend (Anon/Auth) pode LER opportunities e events, mas NÃO settings ou budget.

CREATE POLICY "Public read opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);

-- Settings só admin (ou service role) mexe. Bloqueado para public.
