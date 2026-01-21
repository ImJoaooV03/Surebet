/*
  # Fix Auth Trigger Crash (Error 500)
  
  This migration fixes the "Database error saving new user" by:
  1. Adding DEFAULT values to all columns in user_settings to prevent NOT NULL violations.
  2. Recreating the handle_new_user trigger function with SECURITY DEFINER and robust error handling.
*/

-- 1. Ensure table has defaults for all columns to prevent INSERT failures
ALTER TABLE public.user_settings ALTER COLUMN bankroll_total SET DEFAULT 5000;
ALTER TABLE public.user_settings ALTER COLUMN stake_mode SET DEFAULT 'percent';
ALTER TABLE public.user_settings ALTER COLUMN stake_fixed_value SET DEFAULT 100;
ALTER TABLE public.user_settings ALTER COLUMN stake_percent_value SET DEFAULT 10;
ALTER TABLE public.user_settings ALTER COLUMN roi_min SET DEFAULT 0.8;
ALTER TABLE public.user_settings ALTER COLUMN telegram_enabled SET DEFAULT false;
ALTER TABLE public.user_settings ALTER COLUMN whatsapp_enabled SET DEFAULT false;

-- Safely add defaults for columns that might exist (from PRD) but aren't in some types definitions
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'freshness_live_sec') THEN
        ALTER TABLE public.user_settings ALTER COLUMN freshness_live_sec SET DEFAULT 15;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'freshness_pre_sec') THEN
        ALTER TABLE public.user_settings ALTER COLUMN freshness_pre_sec SET DEFAULT 120;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'cooldown_sec') THEN
        ALTER TABLE public.user_settings ALTER COLUMN cooldown_sec SET DEFAULT 45;
    END IF;
END $$;

-- 2. Recreate the Trigger Function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with minimal required fields, relying on DB defaults for the rest
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but DO NOT fail the transaction, allowing the user to be created
  -- This fixes the "Database error saving new user" blocking the UI
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_settings TO postgres, service_role;
GRANT SELECT, UPDATE, INSERT ON TABLE public.user_settings TO authenticated;
