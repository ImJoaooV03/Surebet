/*
  # Final Security Sweep
  
  1. Enables Row Level Security (RLS) on ALL tables in the public schema to resolve "RLS Disabled" errors.
  2. Fixes "Function Search Path Mutable" warning by setting search_path on the auth trigger.
  
  ## Impact
  - High Security: Ensures no table is left unprotected.
  - Safe: Does not modify data, only metadata/permissions.
*/

-- 1. Force Enable RLS on all Enterprise tables
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;
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

-- 2. Fix Function Search Path (Security Best Practice)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Explicitly set search path
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;
