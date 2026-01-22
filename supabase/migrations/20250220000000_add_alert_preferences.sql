-- Adiciona colunas para configurações avançadas de alerta
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS alert_preferences JSONB DEFAULT '{
  "roi_min": 1.5,
  "sports": [],
  "markets": [],
  "bookmakers": [],
  "live_enabled": true,
  "pre_enabled": true,
  "channels": {
    "email": true,
    "push": false,
    "telegram": false
  }
}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.user_settings.alert_preferences IS 'Armazena filtros de alerta (ROI, Esportes, Casas) e canais de notificação';
