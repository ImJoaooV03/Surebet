-- Adiciona colunas para configuração da Odds Blaze API na tabela de configurações do usuário
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS oddsblaze_key TEXT,
ADD COLUMN IF NOT EXISTS oddsblaze_enabled BOOLEAN DEFAULT false;
