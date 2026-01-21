/*
  # Create Missing Tables & Fix RLS
  
  This migration creates the tables that were defined in the PRD but missing from the database:
  - alerts
  - integrations_telegram
  - integrations_whatsapp
  
  It also enables RLS and adds policies for them.
*/

-- 1. Create 'alerts' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arb_id UUID REFERENCES public.arbs(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    channel text CHECK (channel IN ('telegram', 'whatsapp')),
    payload_json jsonb,
    sent_at timestamptz DEFAULT now(),
    delivery_status text CHECK (delivery_status IN ('sent', 'failed', 'queued')),
    error_msg text
);

-- 2. Create 'integrations_telegram' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.integrations_telegram (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    bot_token_encrypted text,
    chat_id text,
    is_enabled boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Create 'integrations_whatsapp' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.integrations_whatsapp (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    token_encrypted text,
    phone_number_id text,
    from_number text,
    is_enabled boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on these tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid conflicts if retrying)

-- Alerts Policies
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own alerts" ON public.alerts;
CREATE POLICY "Users can insert own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Telegram Integration Policies
DROP POLICY IF EXISTS "Users can manage own telegram integration" ON public.integrations_telegram;
CREATE POLICY "Users can manage own telegram integration" ON public.integrations_telegram
    FOR ALL USING (auth.uid() = user_id);

-- WhatsApp Integration Policies
DROP POLICY IF EXISTS "Users can manage own whatsapp integration" ON public.integrations_whatsapp;
CREATE POLICY "Users can manage own whatsapp integration" ON public.integrations_whatsapp
    FOR ALL USING (auth.uid() = user_id);
