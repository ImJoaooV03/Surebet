-- Adiciona a coluna de role se não existir
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Atualiza o usuário específico para Admin e Premium
-- Usa uma subquery segura para encontrar o ID baseado no email na tabela auth.users
UPDATE public.user_settings
SET 
  role = 'admin',
  is_premium = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'joaovicrengel@gmail.com'
);
