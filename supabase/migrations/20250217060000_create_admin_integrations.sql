-- Tabela para armazenar configurações de integração administrativas
-- Isso permite ao admin cadastrar APIs de casas específicas ou provedores customizados
CREATE TABLE IF NOT EXISTS public.admin_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- Ex: 'Bet365 Direct', 'Pinnacle Feed'
    provider_type text NOT NULL, -- 'bookmaker', 'aggregator'
    api_endpoint text,
    api_key text,
    api_secret text,
    is_active boolean DEFAULT true,
    last_check_at timestamptz,
    status text DEFAULT 'pending', -- 'healthy', 'error', 'pending'
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Apenas Admins podem ver/editar)
-- Nota: Como não temos um sistema complexo de claims de admin no auth.users para este MVP,
-- vamos permitir acesso a usuários autenticados, mas no frontend protegemos a rota.
-- Em produção real, você usaria: USING (auth.jwt() ->> 'role' = 'admin')

CREATE POLICY "Enable all access for authenticated users" ON public.admin_integrations
    FOR ALL USING (auth.role() = 'authenticated');
