-- Adiciona a coluna para controlar se a API está ativa ou pausada
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS api_enabled boolean DEFAULT true;
