-- HARD RESET: Limpar tabelas antigas que conflitam com o novo tipo de ID
DROP TABLE IF EXISTS arb_legs CASCADE;
DROP TABLE IF EXISTS arbs CASCADE;
DROP TABLE IF EXISTS odds CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_queue CASCADE;
DROP TABLE IF EXISTS odds_snapshots CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS request_budget CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- 1) app_settings
CREATE TABLE app_settings (
    id int PRIMARY KEY DEFAULT 1,
    apisports_key text,
    cron_token text,
    sports_enabled jsonb DEFAULT '{"football":true,"basketball":true}',
    roi_min_pre numeric DEFAULT 0.008,
    roi_min_live numeric DEFAULT 0.015,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir linha padrão
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 2) request_budget
CREATE TABLE request_budget (
    day date NOT NULL,
    sport_key text NOT NULL,
    used int DEFAULT 0,
    PRIMARY KEY (day, sport_key)
);

-- 3) events (Agora com ID numérico BIGSERIAL para performance)
CREATE TABLE events (
    id bigserial PRIMARY KEY,
    sport_key text NOT NULL,
    provider_event_id text NOT NULL,
    league_id text,
    start_time_utc timestamptz NOT NULL,
    home_name text NOT NULL,
    away_name text NOT NULL,
    status text DEFAULT 'scheduled',
    score_json jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now(),
    UNIQUE(sport_key, provider_event_id)
);

-- 4) event_queue
CREATE TABLE event_queue (
    event_id bigint PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    bucket text NOT NULL, -- LIVE, PRE_HOT, PRE_MID, PRE_LONG
    priority_score int DEFAULT 0,
    last_odds_fetch_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

-- 5) odds_snapshots
CREATE TABLE odds_snapshots (
    event_id bigint PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    snapshot_hash text NOT NULL,
    snapshot_json jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 6) opportunities (Surebets calculadas)
CREATE TABLE opportunities (
    id bigserial PRIMARY KEY,
    event_id bigint REFERENCES events(id) ON DELETE CASCADE,
    sport_key text NOT NULL,
    bucket text NOT NULL,
    market_key text NOT NULL,
    line_value text,
    period text DEFAULT 'FT',
    include_ot boolean DEFAULT false,
    roi numeric NOT NULL,
    legs_json jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Permissões
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Políticas simples para permitir leitura pública (dashboard) e escrita apenas para service_role (backend)
CREATE POLICY "Public read opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);

-- Service role tem acesso total (padrão do Supabase, mas garantindo)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
