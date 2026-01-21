-- FIX ENTERPRISE RLS (Idempotent Version)
-- This script drops existing policies before creating them to avoid "policy already exists" errors.

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS arb_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS integrations_whatsapp ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public read sports" ON sports;
DROP POLICY IF EXISTS "Public read leagues" ON leagues;
DROP POLICY IF EXISTS "Public read teams" ON teams;
DROP POLICY IF EXISTS "Public read books" ON books;
DROP POLICY IF EXISTS "Public read events" ON events;
DROP POLICY IF EXISTS "Public read markets" ON markets;
DROP POLICY IF EXISTS "Public read odds" ON odds;
DROP POLICY IF EXISTS "Authenticated read arbs" ON arbs;
DROP POLICY IF EXISTS "Authenticated read arb_legs" ON arb_legs;
DROP POLICY IF EXISTS "Users manage own alerts" ON alerts;
DROP POLICY IF EXISTS "Users manage own telegram" ON integrations_telegram;
DROP POLICY IF EXISTS "Users manage own whatsapp" ON integrations_whatsapp;

-- Policies for Simulation/Worker (Allow Insert for Authenticated Users)
DROP POLICY IF EXISTS "Worker insert events" ON events;
DROP POLICY IF EXISTS "Worker insert markets" ON markets;
DROP POLICY IF EXISTS "Worker insert odds" ON odds;
DROP POLICY IF EXISTS "Worker insert arbs" ON arbs;
DROP POLICY IF EXISTS "Worker insert arb_legs" ON arb_legs;
DROP POLICY IF EXISTS "Worker insert sports" ON sports;
DROP POLICY IF EXISTS "Worker insert leagues" ON leagues;
DROP POLICY IF EXISTS "Worker insert teams" ON teams;
DROP POLICY IF EXISTS "Worker insert books" ON books;

-- 3. Re-create Policies

-- Public/Shared Data (Read Only for everyone, Write for Auth/Worker)
CREATE POLICY "Public read sports" ON sports FOR SELECT USING (true);
CREATE POLICY "Worker insert sports" ON sports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Worker insert leagues" ON leagues FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Worker insert teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Worker insert books" ON books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Operational Data (Read for Auth, Write for Auth/Worker)
CREATE POLICY "Public read events" ON events FOR SELECT USING (true); -- Changed to public read for dashboard visibility
CREATE POLICY "Worker insert events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Worker insert markets" ON markets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read odds" ON odds FOR SELECT USING (true);
CREATE POLICY "Worker insert odds" ON odds FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read arbs" ON arbs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Worker insert arbs" ON arbs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read arb_legs" ON arb_legs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Worker insert arb_legs" ON arb_legs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Private Data
CREATE POLICY "Users manage own alerts" ON alerts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own telegram" ON integrations_telegram
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own whatsapp" ON integrations_whatsapp
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
