-- Adiciona colunas para a segunda API na tabela de configurações
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS secondary_api_key text,
ADD COLUMN IF NOT EXISTS secondary_api_enabled boolean DEFAULT false;
