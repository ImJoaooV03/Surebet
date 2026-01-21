-- Adiciona colunas para a Terceira API (BetsAPI)
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS tertiary_api_key text,
ADD COLUMN IF NOT EXISTS tertiary_api_enabled boolean DEFAULT false;
