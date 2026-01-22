-- V2 CLEAN SCHEMA
-- Resetando estrutura para garantir integridade

DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS odds_snapshots CASCADE;
DROP TABLE IF EXISTS event_queue CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS request_budget CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- 1. Configurações Globais
CREATE TABLE app_settings (
    id int PRIMARY KEY DEFAULT 1,
    apisports_key text NOT NULL DEFAULT '',
    cron_token text NOT NULL DEFAULT '',
    sports_enabled jsonb NOT NULL DEFAULT '{"football":true,"basketball":true}'::jsonb,
    roi_min_pre numeric NOT NULL DEFAULT 0.008,
    roi_min_live numeric NOT NULL DEFAULT 0.015,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir linha padrão
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Controle de Budget (Cota de API)
CREATE TABLE request_budget (
    day date NOT NULL,
    sport_key text NOT NULL,
    used int NOT NULL DEFAULT 0,
    PRIMARY KEY (day, sport_key)
);

-- 3. Eventos (Jogos)
CREATE TABLE events (
    id bigserial PRIMARY KEY,
    sport_key text NOT NULL,
    provider_event_id text NOT NULL,
    league_id text,
    start_time_utc timestamptz NOT NULL,
    home_name text NOT NULL,
    away_name text NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    score_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (sport_key, provider_event_id)
);

CREATE INDEX events_start_time_idx ON events(start_time_utc);

-- 4. Fila de Prioridade para Odds
CREATE TABLE event_queue (
    event_id bigint PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    bucket text NOT NULL, -- 'LIVE', 'PRE_HOT', 'PRE_MID', 'PRE_LONG'
    priority_score int NOT NULL DEFAULT 0,
    last_odds_fetch_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Snapshots de Odds (Cache para evitar requests desnecessários)
CREATE TABLE odds_snapshots (
    event_id bigint PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    snapshot_hash text NOT NULL,
    snapshot_json jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Oportunidades (Surebets)
CREATE TABLE opportunities (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sport_key text NOT NULL,
    bucket text NOT NULL,
    market_key text NOT NULL,
    line_value text,
    period text NOT NULL DEFAULT 'FT',
    include_ot boolean NOT NULL DEFAULT false,
    roi numeric NOT NULL,
    legs_json jsonb NOT NULL,
    signature text NOT NULL, -- Hash único para dedupe
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX opportunities_signature_unique ON opportunities(signature);
CREATE INDEX opportunities_created_at_idx ON opportunities(created_at DESC);
CREATE INDEX opportunities_roi_idx ON opportunities(roi DESC);

-- Habilitar RLS (Segurança)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Backend Service Role tem acesso total, Frontend tem leitura pública em dados não sensíveis)
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read opportunities" ON opportunities FOR SELECT USING (true);
-- Settings e Budget são restritos (apenas service role acessa via backend functions)
