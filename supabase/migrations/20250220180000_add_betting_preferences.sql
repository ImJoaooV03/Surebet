/*
  # Add Betting Preferences
  
  Adiciona colunas JSONB para armazenar configurações granulares de casas de aposta e mercados.
  Isso permite flexibilidade total sem criar dezenas de tabelas relacionais.
*/

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS bookmaker_settings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS market_settings JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.user_settings.bookmaker_settings IS 'Configurações de cada casa: enabled, commission, limits, currency';
COMMENT ON COLUMN public.user_settings.market_settings IS 'Configurações de mercados: enabled, periods (ft/ht), complexity';
