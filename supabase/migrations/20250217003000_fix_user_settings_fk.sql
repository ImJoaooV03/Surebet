-- Fix Foreign Key Constraint for User Settings
-- Redirects the relationship to auth.users to prevent sync issues

BEGIN;

-- 1. Drop the existing constraint (which likely points to public.users)
ALTER TABLE public.user_settings 
DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- 2. Add the new constraint pointing to auth.users
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Ensure permissions are correct
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

COMMIT;
