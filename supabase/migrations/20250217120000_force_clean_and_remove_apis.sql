-- Força a limpeza de TODAS as chaves de API de todos os usuários
UPDATE public.user_settings
SET 
  external_api_key = NULL,
  api_enabled = false,
  secondary_api_key = NULL,
  secondary_api_enabled = false,
  tertiary_api_key = NULL,
  tertiary_api_enabled = false,
  quaternary_api_key = NULL,
  quaternary_api_enabled = false;

-- Limpa todas as tabelas operacionais com CASCADE para garantir que o histórico suma
TRUNCATE TABLE 
  public.arb_legs,
  public.arbs,
  public.odds,
  public.markets,
  public.events
CASCADE;
