-- 1. Atualizar tabela user_settings para suportar nomes de planos específicos
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'basic';

-- 2. Criar tabela de códigos de ativação
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    plan_type text NOT NULL CHECK (plan_type IN ('pro', 'premium')),
    is_used boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id),
    used_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    used_at timestamptz
);

-- 3. Habilitar RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)
-- Admin pode ver e criar códigos
CREATE POLICY "Admins can view all codes" ON public.activation_codes
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert codes" ON public.activation_codes
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Função Segura para Resgatar Código (RPC)
-- Isso garante que a validação e a atualização aconteçam juntas (Transação Atômica)
CREATE OR REPLACE FUNCTION public.redeem_activation_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_code record;
    user_id uuid;
BEGIN
    user_id := auth.uid();

    -- Verificar se o código existe e não foi usado
    SELECT * INTO found_code
    FROM public.activation_codes
    WHERE code = code_input AND is_used = false
    FOR UPDATE; -- Trava a linha para evitar condição de corrida

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Código inválido ou já utilizado.');
    END IF;

    -- Marcar código como usado
    UPDATE public.activation_codes
    SET is_used = true, used_by = user_id, used_at = now()
    WHERE id = found_code.id;

    -- Atualizar plano do usuário
    UPDATE public.user_settings
    SET 
        plan = found_code.plan_type,
        is_premium = true, -- Pro e Premium são considerados premium
        updated_at = now()
    WHERE user_id = user_id;

    RETURN json_build_object('success', true, 'message', 'Plano ' || found_code.plan_type || ' ativado com sucesso!');
END;
$$;
