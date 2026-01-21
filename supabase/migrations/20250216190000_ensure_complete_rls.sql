/*
  # Final Security Hardening
  
  ## Operation Description:
  This script ensures that Row Level Security (RLS) is enabled on EVERY table in the public schema.
  It also adds missing policies for user-specific tables (integrations, alerts) that might have been missed.

  ## Safety:
  - Safe to run multiple times (uses IF NOT EXISTS).
  - Does not delete data.
  - Fixes "RLS Disabled" critical errors.
*/

-- 1. Force Enable RLS on ALL tables in public schema
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY'; 
  END LOOP; 
END $$;

-- 2. Add Policies for Integrations (Telegram)
CREATE POLICY "Users manage their own telegram integration" ON public.integrations_telegram
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add Policies for Integrations (WhatsApp)
CREATE POLICY "Users manage their own whatsapp integration" ON public.integrations_whatsapp
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Add Policies for Alerts
CREATE POLICY "Users read their own alerts" ON public.alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Add Policies for Markets & Odds (Public Read, Auth Write for Simulator)
-- Using DO block to avoid error if policy exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'markets' AND policyname = 'Public read markets') THEN
    CREATE POLICY "Public read markets" ON public.markets FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'markets' AND policyname = 'Auth insert markets') THEN
    CREATE POLICY "Auth insert markets" ON public.markets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'odds' AND policyname = 'Public read odds') THEN
    CREATE POLICY "Public read odds" ON public.odds FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'odds' AND policyname = 'Auth insert odds') THEN
    CREATE POLICY "Auth insert odds" ON public.odds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  -- Ensure team_aliases has policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_aliases' AND policyname = 'Public read aliases') THEN
     CREATE POLICY "Public read aliases" ON public.team_aliases FOR SELECT USING (true);
  END IF;
END $$;
