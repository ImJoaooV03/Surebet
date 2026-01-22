-- 1. Garantir que as colunas da Sportmonks existam antes de tentar limpá-las
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'quaternary_api_key') THEN
        ALTER TABLE public.user_settings ADD COLUMN quaternary_api_key text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'quaternary_api_enabled') THEN
        ALTER TABLE public.user_settings ADD COLUMN quaternary_api_enabled boolean DEFAULT false;
    END IF;
END $$;

-- 2. Agora sim, executar o Hard Reset (Limpar chaves e dados)
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

-- 3. Limpar todos os dados operacionais (Jogos, Odds, Arbs)
TRUNCATE TABLE public.arb_legs, public.arbs, public.odds, public.markets, public.events CASCADE;
