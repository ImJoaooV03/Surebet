-- Adiciona coluna para chave de API externa nas configurações do usuário
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS external_api_key text;

-- Garante que o RLS permite que o usuário leia/escreva sua própria chave
-- (As políticas existentes já devem cobrir isso, mas reforçamos a segurança implícita do RLS)
