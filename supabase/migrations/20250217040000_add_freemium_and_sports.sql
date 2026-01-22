-- 1. Adicionar campo de status Premium nas configurações do usuário
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- 2. Inserir novos esportes suportados
INSERT INTO public.sports (name, key) VALUES 
('Futebol Americano', 'american_football'),
('Tênis', 'tennis'),
('eSports', 'esports')
ON CONFLICT (key) DO NOTHING;

-- 3. Atualizar permissões (garantia)
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.sports TO authenticated;
